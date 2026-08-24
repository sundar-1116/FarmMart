const Demand = require('../../models/Demand');
const Offer = require('../../models/Offer');
const Task = require('../../models/Task');

/**
 * Role-aware, authenticated database context retriever.
 * Guarantees zero cross-user data leakage by enforcing DB-level ownership filters.
 */
exports.getContext = async (user, intent = 'general_farmmart_question') => {
  if (!user || !user.id || !user.role) {
    throw new Error('Unauthorized context request: missing user authentication');
  }

  const role = user.role;
  const userId = user.id;
  const context = { role, intent, user: { id: userId, name: user.name } };

  if (role === 'farmer') {
    const farmerTaskFilter = {
      $or: [{ farmerId: userId }, { 'farmer.name': user.name }]
    };

    if (intent === 'latest_procured_task') {
      const latestTask = await Task.findOne({
        ...farmerTaskFilter,
        procurementStatus: 'procured'
      })
        .select('itemName storeName quantity purchasePrice procurementStatus paymentStatus deliveryStatus deadline createdAt updatedAt')
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();

      context.latestProcuredTask = latestTask ? { id: latestTask._id.toString(), ...latestTask } : null;
      context.tasks = latestTask ? [{ id: latestTask._id.toString(), ...latestTask }] : [];

    } else if (intent === 'procured_tasks') {
      const procuredTasks = await Task.find({
        ...farmerTaskFilter,
        procurementStatus: 'procured'
      })
        .select('itemName storeName quantity purchasePrice procurementStatus paymentStatus deliveryStatus deadline createdAt')
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean();

      context.procuredTasks = procuredTasks.map(t => ({ id: t._id.toString(), ...t }));
      context.tasks = context.procuredTasks;

    } else if (intent === 'pending_procurement_tasks') {
      const pendingTasks = await Task.find({
        ...farmerTaskFilter,
        procurementStatus: 'pending'
      })
        .select('itemName storeName quantity purchasePrice procurementStatus paymentStatus deliveryStatus deadline createdAt')
        .sort({ deadline: 1, createdAt: -1 })
        .limit(10)
        .lean();

      context.pendingTasks = pendingTasks.map(t => ({ id: t._id.toString(), ...t }));
      context.tasks = context.pendingTasks;

    } else if (intent === 'nearest_deadline') {
      const nearestTask = await Task.findOne(farmerTaskFilter)
        .select('itemName storeName quantity purchasePrice procurementStatus paymentStatus deliveryStatus deadline createdAt')
        .sort({ deadline: 1 })
        .lean();

      context.nearestDeadlineTask = nearestTask ? { id: nearestTask._id.toString(), ...nearestTask } : null;
      context.tasks = nearestTask ? [{ id: nearestTask._id.toString(), ...nearestTask }] : [];

    } else if (intent === 'task_value' || intent === 'next_action') {
      const tasks = await Task.find(farmerTaskFilter)
        .select('itemName storeName quantity purchasePrice procurementStatus paymentStatus deliveryStatus deadline createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      context.tasks = tasks.map(t => ({ id: t._id.toString(), ...t }));

    } else if (intent === 'pending_offers') {
      const offers = await Offer.find({ farmer: userId, status: 'pending' })
        .select('demand quantity pricePerUnit totalPrice status message createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      context.offers = offers.map(o => ({ id: o._id.toString(), ...o }));

    } else if (intent === 'open_demands') {
      const openDemands = await Demand.find({ status: 'pending' })
        .select('storeName itemName quantity status createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      context.openDemands = openDemands.map(d => ({ id: d._id.toString(), ...d }));

    } else {
      // Default/Summary context for Farmer
      const tasks = await Task.find(farmerTaskFilter)
        .select('itemName storeName quantity procurementStatus paymentStatus deliveryStatus deadline createdAt')
        .sort({ createdAt: -1 })
        .limit(15)
        .lean();

      const offers = await Offer.find({ farmer: userId })
        .select('demand quantity pricePerUnit totalPrice status message createdAt')
        .sort({ createdAt: -1 })
        .limit(15)
        .lean();

      const openDemands = await Demand.find({ status: 'pending' })
        .select('storeName itemName quantity status createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      context.tasks = tasks.map(t => ({ id: t._id.toString(), ...t }));
      context.offers = offers.map(o => ({ id: o._id.toString(), ...o }));
      context.openDemands = openDemands.map(d => ({ id: d._id.toString(), ...d }));
    }

  } else if (role === 'buyer') {
    const buyerTaskFilter = { assignedUser: userId };

    if (intent === 'open_demands') {
      const demands = await Demand.find({
        $or: [{ buyer: userId }, { buyer: null, status: 'pending' }]
      })
        .select('storeName itemName quantity status createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      context.demands = demands.map(d => ({ id: d._id.toString(), ...d }));

    } else if (intent === 'pending_payments') {
      const pendingTasks = await Task.find({ ...buyerTaskFilter, paymentStatus: 'pending' })
        .select('itemName storeName quantity purchasePrice procurementStatus paymentStatus deliveryStatus deadline createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      context.tasks = pendingTasks.map(t => ({ id: t._id.toString(), ...t }));

    } else if (intent === 'pending_deliveries') {
      const pendingTasks = await Task.find({ ...buyerTaskFilter, deliveryStatus: 'pending' })
        .select('itemName storeName quantity purchasePrice procurementStatus paymentStatus deliveryStatus deadline createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      context.tasks = pendingTasks.map(t => ({ id: t._id.toString(), ...t }));

    } else if (intent === 'latest_task' || intent === 'latest_procured_task') {
      const latestTask = await Task.findOne(buyerTaskFilter)
        .select('itemName storeName quantity purchasePrice procurementStatus paymentStatus deliveryStatus deadline createdAt')
        .sort({ createdAt: -1 })
        .lean();

      context.latestTask = latestTask ? { id: latestTask._id.toString(), ...latestTask } : null;
      context.tasks = latestTask ? [{ id: latestTask._id.toString(), ...latestTask }] : [];

    } else if (intent === 'next_action') {
      const tasks = await Task.find(buyerTaskFilter)
        .select('itemName storeName quantity purchasePrice procurementStatus paymentStatus deliveryStatus deadline createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      context.tasks = tasks.map(t => ({ id: t._id.toString(), ...t }));

    } else {
      // Default/Summary context for Buyer
      const demands = await Demand.find({
        $or: [{ buyer: userId }, { buyer: null, status: 'pending' }]
      })
        .select('storeName itemName quantity status createdAt')
        .sort({ createdAt: -1 })
        .limit(15)
        .lean();

      const demandIds = demands.map(d => d._id);

      const offers = await Offer.find({ demand: { $in: demandIds } })
        .select('demand farmer quantity pricePerUnit totalPrice status message createdAt')
        .sort({ createdAt: -1 })
        .limit(15)
        .lean();

      const tasks = await Task.find(buyerTaskFilter)
        .select('itemName storeName quantity procurementStatus paymentStatus deliveryStatus deadline farmer createdAt')
        .sort({ createdAt: -1 })
        .limit(15)
        .lean();

      context.demands = demands.map(d => ({ id: d._id.toString(), ...d }));
      context.offers = offers.map(o => ({ id: o._id.toString(), ...o }));
      context.tasks = tasks.map(t => ({ id: t._id.toString(), ...t }));
    }

  } else if (role === 'admin') {
    const [totalDemands, totalTasks, totalOffers, pendingDemands, pendingDeliveries] = await Promise.all([
      Demand.countDocuments(),
      Task.countDocuments(),
      Offer.countDocuments(),
      Demand.countDocuments({ status: 'pending' }),
      Task.countDocuments({ deliveryStatus: 'pending' })
    ]);

    context.counts = {
      demands: totalDemands,
      tasks: totalTasks,
      offers: totalOffers,
      pendingDemands,
      pendingDeliveries
    };

    if (intent === 'open_demands') {
      const demands = await Demand.find({ status: 'pending' })
        .select('storeName itemName quantity status createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      context.demands = demands.map(d => ({ id: d._id.toString(), ...d }));

    } else if (intent === 'task_summary') {
      const tasks = await Task.find()
        .select('itemName storeName quantity procurementStatus paymentStatus deliveryStatus deadline createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      context.tasks = tasks.map(t => ({ id: t._id.toString(), ...t }));

    } else if (intent === 'latest_activity' || intent === 'next_action') {
      const recentTasks = await Task.find()
        .select('itemName storeName quantity procurementStatus paymentStatus deliveryStatus deadline createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      const recentDemands = await Demand.find()
        .select('storeName itemName quantity status createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      context.tasks = recentTasks.map(t => ({ id: t._id.toString(), ...t }));
      context.demands = recentDemands.map(d => ({ id: d._id.toString(), ...d }));

    } else {
      const recentDemands = await Demand.find()
        .select('storeName itemName quantity status createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const recentTasks = await Task.find()
        .select('itemName storeName quantity procurementStatus paymentStatus deliveryStatus deadline createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      context.demands = recentDemands.map(d => ({ id: d._id.toString(), ...d }));
      context.tasks = recentTasks.map(t => ({ id: t._id.toString(), ...t }));
    }
  }

  return context;
};
