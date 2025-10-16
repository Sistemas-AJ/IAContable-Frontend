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
        <div key={msg.id || msg.text} className={`message ${msg.isUser ? 'user' : 'bot'} ${msg.isLoading ? 'loading' : ''}`}>
          {msg.isLoading ? (
            <div className="loading-indicator">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              {msg.text}
            </div>
          ) : (
            msg.isUser
              ? <div className="user-message">{msg.text}</div>
              : isFinancialAnalysis
                ? <div className="chatbot-analysis bot-message">{formatBotMessage(msg.text, true)}</div>
                : <div className="bot-message">{formatBotMessage(msg.text)}</div>
          )}
        </div>
      );
    })}
    {isLoading && (
      <div className="message bot loading">
        <div className="loading-indicator">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          Pensando...
        </div>
      </div>
    )}
  </div>
);

export default ChatMessages;
