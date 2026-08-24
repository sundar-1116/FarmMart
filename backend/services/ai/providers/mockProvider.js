class MockProvider {
  async generateResponse({ prompt, context, role, intent }) {
    const startTime = Date.now();
    let answer = '';
    const suggestedActions = [];
    const followUpSuggestions = [];
    const references = { tasks: [], demands: [], offers: [] };

    // Populate references from context
    if (context && context.tasks && context.tasks.length > 0) {
      references.tasks = context.tasks.slice(0, 5).map(t => t.id || t._id);
    }
    if (context && (context.demands || context.openDemands) && (context.demands || context.openDemands).length > 0) {
      const demList = context.demands || context.openDemands;
      references.demands = demList.slice(0, 5).map(d => d.id || d._id);
    }
    if (context && context.offers && context.offers.length > 0) {
      references.offers = context.offers.slice(0, 5).map(o => o.id || o._id);
    }

    if (role === 'farmer') {
      if (intent === 'latest_procured_task') {
        const t = context.latestProcuredTask || (context.tasks || []).find(x => x.procurementStatus === 'procured');
        if (t) {
          const val = t.purchasePrice ? `₹${t.purchasePrice.toLocaleString()}` : (t.pricePerUnit ? `₹${(t.pricePerUnit * t.quantity).toLocaleString()}` : 'N/A');
          answer = `Latest Procured Task:\n• Item: ${t.itemName} (${t.quantity} kg)\n• Store: ${t.storeName}\n• Procurement Status: Procured\n• Purchase Value: ${val}\n• Deadline: ${t.deadline ? new Date(t.deadline).toLocaleDateString() : 'N/A'}`;
          suggestedActions.push({ label: 'View Tasks', route: '/tasks' });
        } else {
          answer = `You do not have any procured tasks yet. All assigned tasks are currently pending procurement confirmation.`;
          suggestedActions.push({ label: 'View Tasks', route: '/tasks' });
        }
        followUpSuggestions.push('How much is it worth?', 'When is it due?', 'What should I do next?');

      } else if (intent === 'procured_tasks') {
        const procured = context.procuredTasks || (context.tasks || []).filter(x => x.procurementStatus === 'procured');
        if (procured.length > 0) {
          const lines = procured.slice(0, 3).map(t => `• ${t.itemName} (${t.quantity} kg) @ ${t.storeName} — Status: Procured`);
          const countInfo = procured.length > 3 ? `Showing 3 of ${procured.length} procured tasks.` : `Showing all ${procured.length} procured tasks.`;
          answer = `Completed Procured Tasks:\n${lines.join('\n')}\n\n${countInfo}`;
          suggestedActions.push({ label: 'View Tasks', route: '/tasks' });
        } else {
          answer = `You currently have no completed procurement tasks.`;
          suggestedActions.push({ label: 'View Tasks', route: '/tasks' });
        }
        followUpSuggestions.push('Which one is the latest?', 'How much is that worth?', 'What should I do next?');

      } else if (intent === 'pending_procurement_tasks') {
        const pending = context.pendingTasks || (context.tasks || []).filter(x => x.procurementStatus === 'pending' || !x.procurementStatus);
        if (pending.length > 0) {
          const lines = pending.slice(0, 3).map(t => `• ${t.itemName} (${t.quantity} kg) @ ${t.storeName} — Deadline: ${t.deadline ? new Date(t.deadline).toLocaleDateString() : 'N/A'}`);
          const countInfo = pending.length > 3 ? `Showing 3 of ${pending.length} pending procurement tasks.` : `Showing all ${pending.length} pending procurement tasks.`;
          answer = `Pending Procurement Tasks:\n${lines.join('\n')}\n\n${countInfo}\n\nRecommended next step: Mark items as procured once harvested and ready for store delivery.`;
          suggestedActions.push({ label: 'View Tasks', route: '/tasks' });
        } else {
          answer = `You currently have no pending procurement tasks. All your assigned orders have been procured.`;
          suggestedActions.push({ label: 'View Demands', route: '/demands' });
        }
        followUpSuggestions.push('Which one is urgent?', 'How much is it worth?', 'What should I do next?');

      } else if (intent === 'nearest_deadline') {
        const t = context.nearestDeadlineTask || (context.tasks || []).sort((a,b) => new Date(a.deadline || 0) - new Date(b.deadline || 0))[0];
        if (t) {
          const val = t.purchasePrice ? `₹${t.purchasePrice.toLocaleString()}` : 'N/A';
          answer = `Earliest Upcoming Task Deadline:\n• Item: ${t.itemName} (${t.quantity} kg)\n• Store: ${t.storeName}\n• Deadline: ${t.deadline ? new Date(t.deadline).toLocaleDateString() : 'N/A'}\n• Procurement Status: ${t.procurementStatus || 'pending'}\n• Purchase Worth: ${val}`;
          suggestedActions.push({ label: 'View Tasks', route: '/tasks' });
        } else {
          answer = `No upcoming task deadlines found in your account.`;
        }
        followUpSuggestions.push('How much is that worth?', 'What should I do next?', 'Show my pending offers');

      } else if (intent === 'task_value') {
        const t = context.tasks && context.tasks[0];
        if (t) {
          const val = t.purchasePrice ? `₹${t.purchasePrice.toLocaleString()}` : (t.quantity && t.pricePerUnit ? `₹${(t.quantity * t.pricePerUnit).toLocaleString()}` : 'Unavailable');
          answer = `Purchase Value Breakdown:\n• Item: ${t.itemName} (${t.quantity} kg)\n• Store: ${t.storeName}\n• Total Purchase Worth: ${val}\n• Payment Status: ${t.paymentStatus || 'pending'}`;
        } else {
          answer = `Task value information is currently unavailable. No specific task was found.`;
        }
        followUpSuggestions.push('When is it due?', 'What should I do next?', 'Show my pending procurement tasks');

      } else if (intent === 'next_action') {
        const tasks = context.tasks || [];
        const pendingProc = tasks.filter(t => t.procurementStatus === 'pending');
        if (pendingProc.length > 0) {
          answer = `Recommended Next Action:\nYou have ${pendingProc.length} pending procurement task(s). First priority is to mark '${pendingProc[0].itemName}' for ${pendingProc[0].storeName} as procured in your Tasks dashboard.`;
        } else if (tasks.length > 0) {
          answer = `Recommended Next Action:\nAll procurement tasks are marked as procured. Monitor your Tasks page for payment clearance and delivery updates.`;
        } else {
          answer = `Recommended Next Action:\nBrowse active store demands on the Marketplace and submit competitive supply offers.`;
        }
        suggestedActions.push({ label: 'View Tasks', route: '/tasks' });
        suggestedActions.push({ label: 'View Demands', route: '/demands' });
        followUpSuggestions.push('Which task is urgent?', 'Show my pending offers', 'Give me a procurement summary');

      } else if (intent === 'pending_offers') {
        const offers = context.offers || [];
        if (offers.length > 0) {
          const lines = offers.slice(0, 3).map(o => `• Quantity: ${o.quantity} kg @ ₹${o.pricePerUnit}/kg — Total: ₹${o.totalPrice || (o.quantity * o.pricePerUnit)} (${o.status})`);
          answer = `Active Pending Offers (${offers.length} total):\n${lines.join('\n')}`;
        } else {
          answer = `You currently have no active pending negotiation offers.`;
        }
        suggestedActions.push({ label: 'View Demands', route: '/demands' });
        followUpSuggestions.push('Show my open demands', 'What needs my attention?', 'Show my pending procurement tasks');

      } else {
        const allTasks = context?.tasks || [];
        const pending = allTasks.filter(t => t.procurementStatus === 'pending');
        answer = `Hello Farmer! Here is your FarmMart account summary:\n- Pending Tasks: ${pending.length}\n- Procured Tasks: ${allTasks.length - pending.length}\n- Open Store Demands: ${(context?.openDemands || []).length}`;
        suggestedActions.push({ label: 'View Tasks', route: '/tasks' });
        suggestedActions.push({ label: 'View Demands', route: '/demands' });
        followUpSuggestions.push('Show my pending procurement tasks', 'Show my latest procurement', 'What needs my attention?');
      }

    } else if (role === 'buyer') {
      if (intent === 'open_demands' || intent === 'demand_summary') {
        const demands = context.demands || [];
        if (demands.length > 0) {
          const lines = demands.slice(0, 3).map(d => `• ${d.itemName} (${d.quantity} kg) @ ${d.storeName} — Status: ${d.status}`);
          answer = `Active Store Demands (${demands.length} total):\n${lines.join('\n')}`;
        } else {
          answer = `You currently have no active store demands created.`;
        }
        suggestedActions.push({ label: 'Inspect Demands', route: '/demands' });
        followUpSuggestions.push('What payments are pending?', 'What deliveries need attention?', 'Which task should I handle first?');

      } else if (intent === 'pending_payments') {
        const tasks = (context.tasks || []).filter(t => t.paymentStatus === 'pending' || !t.paymentStatus);
        if (tasks.length > 0) {
          const lines = tasks.slice(0, 3).map(t => `• ${t.itemName} (${t.quantity} kg) @ ${t.storeName} — Payment: Pending (Worth: ₹${t.purchasePrice || 'N/A'})`);
          answer = `Pending Payment Tasks (${tasks.length} total):\n${lines.join('\n')}\n\nPayment clearance is required in your Tasks tab after grower procurement confirmation.`;
        } else {
          answer = `You currently have no pending payments. All active task payments are up to date.`;
        }
        suggestedActions.push({ label: 'View Tasks', route: '/tasks' });
        followUpSuggestions.push('Which task should I handle first?', 'How much is it worth?', 'What deliveries need attention?');

      } else if (intent === 'pending_deliveries') {
        const tasks = (context.tasks || []).filter(t => t.deliveryStatus === 'pending' || !t.deliveryStatus);
        if (tasks.length > 0) {
          const lines = tasks.slice(0, 3).map(t => `• ${t.itemName} (${t.quantity} kg) @ ${t.storeName} — Delivery: Pending (Pay: ${t.paymentStatus})`);
          answer = `Pending Delivery Tasks (${tasks.length} total):\n${lines.join('\n')}\n\nConfirm delivery receipt in your Tasks tab once produce arrives at your store.`;
        } else {
          answer = `You currently have no pending deliveries in transit.`;
        }
        suggestedActions.push({ label: 'View Tasks', route: '/tasks' });
        followUpSuggestions.push('Which task should I handle first?', 'What payments are pending?', 'Show my active demands');

      } else if (intent === 'latest_task' || intent === 'latest_procured_task') {
        const t = context.latestTask || (context.tasks && context.tasks[0]);
        if (t) {
          const val = t.purchasePrice ? `₹${t.purchasePrice.toLocaleString()}` : 'N/A';
          answer = `Latest Procurement Task:\n• Item: ${t.itemName} (${t.quantity} kg)\n• Store: ${t.storeName}\n• Payment: ${t.paymentStatus}\n• Delivery: ${t.deliveryStatus}\n• Purchase Worth: ${val}`;
        } else {
          answer = `No procurement tasks found for your buyer account.`;
        }
        suggestedActions.push({ label: 'View Tasks', route: '/tasks' });
        followUpSuggestions.push('How much is it worth?', 'When is it due?', 'What payments are pending?');

      } else if (intent === 'next_action') {
        const tasks = context.tasks || [];
        const unpaid = tasks.filter(t => t.paymentStatus === 'pending');
        const undelivered = tasks.filter(t => t.deliveryStatus === 'pending');

        if (unpaid.length > 0) {
          answer = `Recommended Next Action:\nYou have ${unpaid.length} task(s) awaiting payment. Priority action: Clear payment for '${unpaid[0].itemName}' @ ${unpaid[0].storeName} on your Tasks page.`;
        } else if (undelivered.length > 0) {
          answer = `Recommended Next Action:\nPayment is cleared for ${undelivered.length} task(s). Priority action: Confirm store delivery receipt for '${undelivered[0].itemName}' once received.`;
        } else {
          answer = `Recommended Next Action:\nAll current tasks are fully paid and delivered. Create new store demands to procure fresh produce.`;
        }
        suggestedActions.push({ label: 'View Tasks', route: '/tasks' });
        suggestedActions.push({ label: 'Inspect Demands', route: '/demands' });
        followUpSuggestions.push('What payments are pending?', 'What deliveries need attention?', 'Show my active demands');

      } else if (intent === 'procurement_summary') {
        const tasks = context.tasks || [];
        const demands = context.demands || [];
        const unpaid = tasks.filter(t => t.paymentStatus === 'pending');
        const undelivered = tasks.filter(t => t.deliveryStatus === 'pending');

        answer = `Buyer Procurement Overview:\n- Active Demands: ${demands.length}\n- Total Tasks: ${tasks.length}\n- Pending Payments: ${unpaid.length}\n- Pending Deliveries: ${undelivered.length}`;
        suggestedActions.push({ label: 'View Tasks', route: '/tasks' });
        suggestedActions.push({ label: 'Inspect Demands', route: '/demands' });
        followUpSuggestions.push('What payments are pending?', 'What deliveries need attention?', 'Which task should I handle first?');

      } else {
        const tasks = context.tasks || [];
        answer = `Hello Buyer! Here is your FarmMart summary:\n- Active Demands: ${(context?.demands || []).length}\n- Active Tasks: ${tasks.length}`;
        suggestedActions.push({ label: 'View Tasks', route: '/tasks' });
        suggestedActions.push({ label: 'Inspect Demands', route: '/demands' });
        followUpSuggestions.push('Show my active demands', 'What payments are pending?', 'Which task should I handle first?');
      }

    } else if (role === 'admin') {
      const counts = context?.counts || {};

      if (intent === 'open_demands' || intent === 'demand_summary') {
        const demands = context.demands || [];
        const lines = demands.slice(0, 3).map(d => `• ${d.itemName} (${d.quantity} kg) @ ${d.storeName} — Status: ${d.status}`);
        answer = `Platform Active Store Demands (${counts.demands ?? demands.length} total, ${counts.pendingDemands ?? 0} pending):\n${lines.join('\n')}`;
        suggestedActions.push({ label: 'Admin Console', route: '/admin' });
        followUpSuggestions.push('Show active procurement tasks', 'What needs attention?', 'Give me a marketplace summary');

      } else if (intent === 'task_summary') {
        const tasks = context.tasks || [];
        const lines = tasks.slice(0, 3).map(t => `• ${t.itemName} (${t.quantity} kg) @ ${t.storeName} — Pay: ${t.paymentStatus}, Deliv: ${t.deliveryStatus}`);
        answer = `Platform Active Procurement Tasks (${counts.tasks ?? tasks.length} total, ${counts.pendingDeliveries ?? 0} pending delivery):\n${lines.join('\n')}`;
        suggestedActions.push({ label: 'Admin Console', route: '/admin' });
        followUpSuggestions.push('Show recent activity', 'What needs attention?', 'Give me a system overview');

      } else if (intent === 'next_action') {
        answer = `Admin Operational Attention Items:\n- ${counts.pendingDemands ?? 0} Store demand(s) currently awaiting supply offers.\n- ${counts.pendingDeliveries ?? 0} Procurement task(s) awaiting delivery completion.`;
        suggestedActions.push({ label: 'Admin Console', route: '/admin' });
        suggestedActions.push({ label: 'User Management', route: '/admin/users' });
        followUpSuggestions.push('Show active demands', 'Show active procurement tasks', 'Show recent activity');

      } else if (intent === 'latest_activity') {
        const tasks = context.tasks || [];
        const lines = tasks.slice(0, 3).map(t => `• Task: ${t.itemName} (${t.quantity} kg) for ${t.storeName}`);
        answer = `Recent Platform Activity Log:\n${lines.join('\n')}`;
        suggestedActions.push({ label: 'Admin Console', route: '/admin' });
        followUpSuggestions.push('Give me a system overview', 'What needs attention?', 'Show active demands');

      } else if (intent === 'marketplace_summary') {
        answer = `Marketplace Intelligence Summary:\n- Active Demands: ${counts.demands ?? 0}\n- Active Negotiation Offers: ${counts.offers ?? 0}\n- Procurement Tasks: ${counts.tasks ?? 0}`;
        suggestedActions.push({ label: 'Admin Console', route: '/admin' });
        followUpSuggestions.push('Show active demands', 'Show active procurement tasks', 'What needs attention?');

      } else {
        answer = `Admin Console Intelligence Overview:\n- Total Store Demands: ${counts.demands ?? 0} (${counts.pendingDemands ?? 0} pending)\n- Total Procurement Tasks: ${counts.tasks ?? 0} (${counts.pendingDeliveries ?? 0} pending delivery)\n- Total Offers: ${counts.offers ?? 0}`;
        suggestedActions.push({ label: 'Admin Console', route: '/admin' });
        suggestedActions.push({ label: 'User Management', route: '/admin/users' });
        followUpSuggestions.push('Give me a system overview', 'Show active demands', 'What needs attention?');
      }

    } else {
      answer = `FarmMart AI Assistant: You currently have authorized access to your procurement dashboard. Ask questions regarding your tasks, demands, or negotiation offers.`;
      followUpSuggestions.push('What needs my attention?', 'Show my tasks');
    }

    const durationMs = Date.now() - startTime;

    return {
      success: true,
      answer,
      intent: intent || 'general_farmmart_question',
      suggestedActions,
      followUpSuggestions,
      references,
      responseTokens: 140,
      durationMs,
      status: 'mock'
    };
  }
}

module.exports = MockProvider;
