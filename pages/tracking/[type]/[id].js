import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';

export default function LogDetailsPage() {
  const router = useRouter();
  const { type, id } = router.query;
  const { data: session } = useSession();
  const [log, setLog] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!type || !id) {
      console.warn('Invalid URL parameters:', { type, id });
      setError('Invalid URL parameters');
      setLoading(false);
      return;
    }
    
    // Validate that type is one of the expected values
    const validTypes = ['pr', 'po', 'delivery', 'postdelivery'];
    if (!validTypes.includes(type)) {
      console.warn('Invalid log type:', type);
      setError('Invalid log type');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    fetch(`/api/logs/${type}/${id}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (!data.log) {
          throw new Error('Log not found');
        }
        setLog(data.log);
        setMessages(data.messages || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching log:', err);
        setError(err.message === 'Log not found' ? 'Log not found' : 'Failed to load log details');
        setLoading(false);
      });
  }, [type, id]);

  const handlePostMessage = async () => {
    if (!messageText.trim()) return;
    setPosting(true);
    setError('');
    try {
      const res = await fetch(`/api/logs/${type}/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText }),
      });
      if (!res.ok) throw new Error('Failed to post message');
      setMessageText('');
      // After posting, redirect to /tracking
      router.push('/tracking');
    } catch (e) {
      setError('Failed to post message');
    } finally {
      setPosting(false);
    }
  };

  const canCloseTracking = (log) => {
    if (!session?.user?.email || !log) return false;
    return (session.user.email === log.createdBy || session.user.email === 'suresh.n@jalint.com.sa') && log.status === 'open';
  };

  const handleCloseTracking = async () => {
    if (!log) return;
    setClosing(true);
    let endpoint = '';
    switch (type) {
      case 'pr':
        endpoint = '/api/logs/pr';
        break;
      case 'po':
        endpoint = '/api/logs/po';
        break;
      case 'delivery':
        endpoint = '/api/logs/delivery';
        break;
      case 'postdelivery':
        endpoint = '/api/logs/postdelivery';
        break;
      default:
        setError('Invalid log type');
        setClosing(false);
        return;
    }
    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: id,
          status: 'closed',
          lastUpdated: new Date().toISOString().split('T')[0]
        }),
      });
      if (!response.ok) throw new Error('Failed to close log');
      // After closing, redirect to /tracking
      router.push('/tracking');
    } catch (e) {
      setError('Failed to close log');
    } finally {
      setClosing(false);
    }
  };

  // Show loading state while fetching
  if (loading) {
    return (
      <div className="bg-light-primary dark:bg-dark-primary min-h-screen">
        <Head>
          <title>Loading Log Details - OPTAIMYZE Portal</title>
        </Head>        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading log details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-light-primary dark:bg-dark-primary min-h-screen">
        <Head>
          <title>Error - OPTAIMYZE Portal</title>
        </Head>        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Log</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/tracking')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Back to Tracking
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!log) {
    return (
      <div className="bg-light-primary dark:bg-dark-primary min-h-screen">
        <Head>
          <title>Log Not Found - OPTAIMYZE Portal</title>
        </Head>        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Log Not Found</h2>
            <p className="text-yellow-600 mb-4">The requested log could not be found.</p>
            <button
              onClick={() => router.push('/tracking')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Back to Tracking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light-primary dark:bg-dark-primary min-h-screen">
      <Head>
        <title>Log Details - OPTAIMYZE Portal</title>
      </Head>      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/tracking')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            ← Back to Tracking
          </button>
        </div>
        
        {/* Close Log Button */}
        {canCloseTracking(log) && (
          <div className="mb-4 flex justify-end">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              onClick={handleCloseTracking}
              disabled={closing}
            >
              {closing ? 'Closing...' : 'Close Log'}
            </button>
          </div>
        )}
        
        <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-2">{log.title}</h2>
          <div className="text-gray-600 dark:text-gray-400 mb-2">{log.requestInfo}</div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <div>Type: <b>{log.type}</b></div>
            <div>Project: <b>{log.project || '-'}</b></div>
            <div>Created by: <b>{log.createdBy}</b></div>
            <div>Created: <b>{log.createdDate}</b></div>
            <div>Status: <b>{log.status}</b></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Message Trail</h3>
          {messages.length === 0 ? (
            <div className="text-gray-400">No messages yet.</div>
          ) : (
            <ul className="space-y-4">
              {messages.map((msg, idx) => (
                <li key={msg._id || idx} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div className="text-gray-800 dark:text-gray-100">{msg.text}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    By {msg.createdBy} on {msg.createdAt}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {log.status === 'open' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <textarea
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 mb-2 dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="Add a message..."
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              disabled={posting}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              onClick={handlePostMessage}
              disabled={posting || !messageText.trim()}
            >
              {posting ? 'Posting...' : 'Post Message'}
            </button>
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg shadow p-4 text-gray-500 dark:text-gray-400">
            This log is closed. No further messages can be added.
          </div>
        )}
      </div>
    </div>
  );
} 