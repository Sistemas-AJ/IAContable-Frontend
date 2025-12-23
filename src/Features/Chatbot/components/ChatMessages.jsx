import React from 'react';
import { formatBotMessage } from '../utils/formatBotMessage.jsx';

const ChatMessages = ({ messages, isLoading }) => (
  <div className="chat-messages">
    {messages.map((msg) => {
      const isFinancialAnalysis =
        !msg.isUser && typeof msg.text === 'string' &&
        (
          msg.text.includes('Análisis de Ratios Financieros') ||
          msg.text.includes('Balance General') ||
          msg.text.includes('Estado de Resultados')
        );
      return (
        <div
          key={msg.id || msg.text}
          className={`message ${msg.isUser ? 'user' : 'bot'} ${msg.isLoading ? 'loading' : ''} ${isFinancialAnalysis ? 'analysis' : ''}`}
        >
          {msg.isLoading ? (
            <div className="loading-indicator">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              {msg.text || 'Pensando...'}
            </div>
          ) : (
            formatBotMessage(msg.text, isFinancialAnalysis)
          )}
        </div>
      );
    })}
  </div>
);

export default ChatMessages;
