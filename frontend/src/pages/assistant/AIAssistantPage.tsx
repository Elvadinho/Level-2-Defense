import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assistantService } from '../../services/assistantService';
import { ChatMessage, AgentRequest } from '../../types/assistant';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import {
  Bot,
  Send,
  Sparkles,
  Clock,
  RefreshCw,
  Loader2,
  User,
} from 'lucide-react';

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<AgentRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationStorageKey = user?.id ? `modoo_assistant_messages_${user.id}` : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Restore this user's conversation after navigating away or refreshing.
  useEffect(() => {
    if (!conversationStorageKey) return;

    try {
      const saved = JSON.parse(localStorage.getItem(conversationStorageKey) || '[]') as ChatMessage[];
      if (Array.isArray(saved) && saved.length > 0) {
        setMessages(saved);
        return;
      }
    } catch {
      // A malformed browser cache should not prevent the assistant from opening.
    }

    setMessages([{
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${user?.name || 'there'}! I am your Modoo Business Assistant. I can analyze project deadlines, summarize customer invoices, check attendance metrics, or assist with daily operations. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  }, [conversationStorageKey, user?.name]);

  useEffect(() => {
    if (conversationStorageKey && messages.length > 0) {
      localStorage.setItem(conversationStorageKey, JSON.stringify(messages));
    }
  }, [conversationStorageKey, messages]);

  // Load history
  const loadHistory = useCallback(async () => {
    try {
      const hist = await assistantService.getHistory();
      setHistory(Array.isArray(hist) ? hist : []);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await assistantService.ask(q);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.explanation || (res.data ? String(JSON.stringify(res.data, null, 2)) : 'Request processed successfully.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: res.status,
        intent: res.intent,
        action: res.action,
        data: res.data,
        agent_request_id: res.agent_request_id,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      loadHistory();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'The assistant could not process your request.';
      setError(message);

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `Sorry, I couldn't complete that request: ${message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'failed',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async (msgId: string, agentRequestId: number, approve: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await assistantService.confirm(agentRequestId, approve);
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.explanation || (approve ? 'Action approved and executed successfully.' : 'Action rejected.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: res.status,
      };

      setMessages((prev) => 
        prev.map(m => m.id === msgId ? { ...m, status: approve ? 'approved' : 'rejected' } : m).concat(assistantMsg)
      );
      loadHistory();
    } catch (err) {
      setError('Failed to process confirmation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistoryClick = (request: AgentRequest) => {
    const existingMessage = messages.find((message) => message.sender === 'user' && message.text === request.user_input);
    if (existingMessage) {
      document.getElementById(`assistant-message-${existingMessage.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setMessages((previous) => [...previous,
      {
        id: `history-question-${request.id}`,
        sender: 'user',
        text: request.user_input || 'Untitled request',
        timestamp: request.created_at ? new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Earlier',
      },
      {
        id: `history-note-${request.id}`,
        sender: 'system',
        text: request.explanation || 'This saved inquiry did not include a readable response. Ask it again to generate an answer using the latest ERP data.',
        timestamp: 'Earlier',
        status: request.status,
        data: request.result,
      },
    ]);
  };

  const samplePrompts = [
    'Summarize outstanding customer invoices',
    'List high-priority tasks due this week',
    'Show today’s employee attendance summary',
    'What is the budget status of active projects?',
  ];

  return (
    <div className="space-y-4">
      {/* Control Panel Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900 tracking-tight">Intelligence</span>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-semibold text-[#05AD98] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#05AD98]" />
            AI Business Assistant
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="sm">
            Ready
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadHistory}
            leftIcon={<RefreshCw className="w-3 h-3" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} isToast={false} />}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Conversation Window */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col h-[min(700px,calc(100vh-220px))] min-h-[420px] overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div
                  key={msg.id}
                  id={`assistant-message-${msg.id}`}
                  className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-lg bg-[#05AD98] flex items-center justify-center text-white shrink-0 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-md md:max-w-lg space-y-2 ${isAssistant ? 'items-start' : 'items-end'}`}>
                    <div
                      className={`p-4 rounded-xl text-xs leading-relaxed ${
                        isAssistant
                          ? 'bg-white border border-slate-200 text-slate-800 shadow-2xs'
                          : 'bg-[#05AD98] text-white shadow-xs font-medium'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {msg.data !== undefined && msg.data !== null && (
                        <details className="mt-2.5 group">
                          <summary className="cursor-pointer text-[11px] font-semibold text-[#05AD98] select-none">
                            View data
                          </summary>
                          <div className="mt-1.5 p-2 bg-slate-50 rounded border border-slate-200 text-[11px] font-mono overflow-x-auto text-slate-700 max-h-64 overflow-y-auto">
                            <pre>{JSON.stringify(msg.data, null, 2)}</pre>
                          </div>
                        </details>
                      )}

                      {isAssistant && msg.status === 'pending' && msg.agent_request_id && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
                          <Button size="sm" variant="primary" onClick={() => handleConfirmAction(msg.id, msg.agent_request_id!, true)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleConfirmAction(msg.id, msg.agent_request_id!, false)}>
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>

                    <div
                      className={`flex items-center gap-2 text-[10px] text-slate-400 px-1 ${
                        isAssistant ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {msg.status && (
                        <span
                          className={`font-semibold capitalize ${
                            msg.status === 'completed' || msg.status === 'done'
                              ? 'text-emerald-600'
                              : msg.status === 'pending'
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          • {msg.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isAssistant && (
                    <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-[#05AD98] flex items-center justify-center text-white shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex items-center gap-2.5 text-xs text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin text-[#05AD98]" />
                  <span>Analyzing ERP workspace data...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions Bar */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Suggestions:</span>
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                className="text-[11px] font-medium bg-white hover:bg-[#05AD98]/10 text-slate-700 hover:text-[#05AD98] px-2.5 py-1 rounded-md border border-slate-200 whitespace-nowrap transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Message Input Box */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about finances, project deadlines, employee records..."
                className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#05AD98] focus:bg-white transition-colors"
                disabled={isLoading}
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isLoading}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Ask
              </Button>
            </form>
          </div>
        </div>

        {/* Sidebar: Recent Queries History */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-[min(700px,calc(100vh-220px))] min-h-[280px] overflow-hidden">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-[#05AD98]" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Inquiries
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-0.5">
            {history.map((req) => (
              <div
                key={req.id}
                onClick={() => handleHistoryClick(req)}
                className="p-3 rounded-lg border border-slate-200 hover:border-[#05AD98]/50 hover:bg-slate-50/80 transition-all cursor-pointer space-y-1.5 text-xs"
              >
                <p className="font-semibold text-slate-800 line-clamp-2 leading-snug">
                  {req.user_input || 'Untitled request'}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  <span className="capitalize">{req.status}</span>
                  <span>{req.created_at ? new Date(req.created_at).toLocaleDateString() : 'recent'}</span>
                </div>
              </div>
            ))}

            {history.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6 italic">No inquiry history yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
