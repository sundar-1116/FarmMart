// ============================================================
// Farmers To Mart — AI Chatbot Assistant Logic
// Handles interactive messaging interface, simulated AI NLP keyword matching,
// typing states, and automated query escalation to Platform Admins.
// ============================================================

(function () {
  'use strict';

  let chatOpened = false;
  let isTyping = false;

  const chatTrigger = document.getElementById('chat-trigger');
  const chatPanel   = document.getElementById('chat-panel');
  const chatMessages= document.getElementById('chat-messages');
  const chatInput   = document.getElementById('chat-input');
  const chatNotif   = document.getElementById('chat-notif');

  // Session user context
  const session = getSession() || { name: 'User', email: 'user@example.com' };
  const userInitials = session.name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

  // Toggle panel visibility
  window.toggleChatbot = function () {
    if (!chatPanel) return;
    
    const isOpen = chatPanel.classList.toggle('open');
    if (chatTrigger) chatTrigger.classList.toggle('active', isOpen);
    chatOpened = isOpen;

    if (isOpen) {
      if (chatNotif) chatNotif.classList.add('hidden');
      
      // If first open, append welcome greeting
      if (!chatMessages.children.length) {
        appendBotMessage("Namaste! 🌾 I am FarmAssistant AI. I can help you find stores, local farmers, seasonal crop availability, and pricing guidelines. Ask me anything, or type 'escalate' to reach the platform admin!");
      }
      setTimeout(() => chatInput && chatInput.focus(), 150);
    }
  };

  // Safe message appending (Strict textContent to avoid XSS)
  function appendMessage(sender, text, isEscalated = false) {
    if (!chatMessages) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    if (isEscalated) {
      msgDiv.classList.add('escalated');
    }

    const av = document.createElement('div');
    av.className = `msg-avatar ${sender === 'user' ? 'user-av' : ''}`;
    av.textContent = sender === 'user' ? userInitials : 'FA';
    msgDiv.appendChild(av);

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    
    const txtSpan = document.createElement('span');
    txtSpan.textContent = text; // textContent — safe
    bubble.appendChild(txtSpan);

    const time = document.createElement('div');
    time.className = 'msg-time';
    const date = new Date();
    time.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    bubble.appendChild(time);

    msgDiv.appendChild(bubble);
    chatMessages.appendChild(msgDiv);
    
    // Auto scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendBotMessage(text) {
    appendMessage('bot', text);
  }

  function appendUserMessage(text) {
    appendMessage('user', text);
  }

  // Render typing indicator
  function showTypingIndicator() {
    if (isTyping || !chatMessages) return;
    isTyping = true;

    const indDiv = document.createElement('div');
    indDiv.className = 'chat-message bot typing-indicator';
    indDiv.id = 'typing-indicator-box';

    const av = document.createElement('div');
    av.className = 'msg-avatar';
    av.textContent = 'FA';
    indDiv.appendChild(av);

    const bubble = document.createElement('div');
    bubble.className = 'typing-bubble';
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'typing-dot';
      bubble.appendChild(dot);
    }
    indDiv.appendChild(bubble);
    chatMessages.appendChild(indDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function removeTypingIndicator() {
    const el = document.getElementById('typing-indicator-box');
    if (el) {
      el.remove();
    }
    isTyping = false;
  }

  // ── AI Response Generation ───────────────────────────────────
  function getBotResponse(input) {
    const text = input.toLowerCase().trim();

    // 1. Check for manual escalation request
    if (text.includes('escalate') || text.includes('admin') || text.includes('speak to human') || text.includes('support') || text.includes('contact support') || text.includes('issue')) {
      return {
        escalate: true,
        reply: "Understood. I am forwarding your message directly to our Platform Administrator for priority manual review. A copy of this report has been emailed to admin@gmail."
      };
    }

    // 2. Keyword matching rules
    if (text.includes('farmer') || text.includes('grower') || text.includes('producer')) {
      return {
        reply: "We have 11 registered farmer groups across Andhra Pradesh and Telangana. Famous growers include Lakshmi Devi (Mangoes & Bananas, Guntur) and Raju Kumar (Tomatoes & Onions, Warangal). You can review all crop types and farm land details in the 'Browse Farmers' section!"
      };
    }

    if (text.includes('store') || text.includes('retail') || text.includes('buy') || text.includes('jio') || text.includes('dmart')) {
      return {
        reply: "Our partner retail chains include JioMart, DMart, Amazon Fresh, Reliance Smart, and More Supermarket. They source fruits and pulses directly from local farms. Filter and locate stores under the 'Browse Stores' tab."
      };
    }

    if (text.includes('crop') || text.includes('fruit') || text.includes('vegetable') || text.includes('pulse') || text.includes('flower') || text.includes('mango') || text.includes('tomato')) {
      return {
        reply: "Currently available fresh harvests include Alphonso Mangoes, Guntur Red Chillies, Organic Tomatoes, Moong Dal, Basmati Rice, and Red Roses. You can search, filter, and procure quantities directly in the 'Fresh Produce' catalog!"
      };
    }

    if (text.includes('price') || text.includes('cost') || text.includes('rate') || text.includes('cheap')) {
      return {
        reply: "All prices are set directly by the farmers to eliminate middlemen. Current rates include Tomatoes at ₹30/kg, Mangoes at ₹120/kg, and Basmati Rice at ₹95/kg. Check out the 'Fresh Produce' section for bulk pricing!"
      };
    }

    if (text.includes('delivery') || text.includes('ship') || text.includes('transport') || text.includes('logistic')) {
      return {
        reply: "We run cooperative transport networks. Produce is harvested in the morning and delivered to partner retail store warehouses within 24 hours to preserve absolute freshness."
      };
    }

    if (text.includes('organic') || text.includes('fertilizer') || text.includes('chemical')) {
      return {
        reply: "Yes, over 80% of our listed farmers practice zero-chemical natural farming. Look for the 'Organic' indicator badges in the crop list!"
      };
    }

    if (text.includes('hello') || text.includes('hi') || text.includes('hey') || text.includes('namaste')) {
      return {
        reply: "Namaste! 🙏 How can I assist you with Farmers To Mart today?"
      };
    }

    // 3. Fallback: prompt for admin escalation
    return {
      suggestEscalate: true,
      reply: "I'm sorry, I don't have details about that specific question yet. Would you like me to escalate this query directly to the Platform Administrator for support?"
    };
  }

  // ── Message Submission ───────────────────────────────────────
  window.submitChatMessage = function (e) {
    if (e) e.preventDefault();
    if (!chatInput) return;

    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    appendUserMessage(text);

    showTypingIndicator();

    setTimeout(() => {
      removeTypingIndicator();

      const response = getBotResponse(text);
      
      if (response.escalate) {
        appendMessage('bot', response.reply, true);
        performEscalation(text);
      } else if (response.suggestEscalate) {
        appendBotMessage(response.reply);
        
        // Add quick choice buttons dynamically
        const choices = document.createElement('div');
        choices.style.cssText = 'display:flex; gap:8px; margin-top:5px; align-self: flex-start; margin-left: 40px';
        choices.className = 'chat-choices';

        const yesBtn = document.createElement('button');
        yesBtn.className = 'suggestion-chip';
        yesBtn.style.borderColor = 'var(--primary-light)';
        yesBtn.style.color = '#fff';
        yesBtn.textContent = 'Yes, Escalate';
        yesBtn.onclick = () => {
          choices.remove();
          showTypingIndicator();
          setTimeout(() => {
            removeTypingIndicator();
            appendMessage('bot', "Inquiry escalated. A platform admin has been notified and a copy of this report has been emailed to admin@gmail.", true);
            performEscalation(text);
          }, 800);
        };

        const noBtn = document.createElement('button');
        noBtn.className = 'suggestion-chip';
        noBtn.textContent = 'No, Thanks';
        noBtn.onclick = () => {
          choices.remove();
          appendBotMessage("No problem! Let me know if there's anything else I can search for.");
        };

        choices.appendChild(yesBtn);
        choices.appendChild(noBtn);
        chatMessages.appendChild(choices);
        chatMessages.scrollTop = chatMessages.scrollHeight;

      } else {
        appendBotMessage(response.reply);
      }

    }, Math.random() * 600 + 400); // realistic typing delay
  };

  // Perform localStorage escalation
  function performEscalation(queryText) {
    addQuery(queryText, session);
    
    // Toast alert
    const container = document.getElementById('toast-container');
    if (container) {
      const toast = document.createElement('div');
      toast.className = 'toast toast-info';
      toast.style.borderColor = 'var(--warning)';
      toast.innerHTML = '⚠️ Query Escalated!<br><span style="font-size:0.85em; opacity:0.9">📧 Report emailed to admin@gmail.</span>';
      container.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }
  }

  // Suggestion chip trigger
  window.handleSuggestion = function (text) {
    if (chatInput) {
      chatInput.value = text;
      submitChatMessage();
    }
  };

  // Trigger notification count on load to draw attention (optional)
  setTimeout(() => {
    if (!chatOpened && chatNotif) {
      chatNotif.classList.remove('hidden');
    }
  }, 10000);

})();
