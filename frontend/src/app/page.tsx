'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const API_URL = 'http://127.0.0.1:5001/api';

interface PlanItem {
  time: string;
  activity: string;
  description: string;
  duration: number;
  priority: number;
  completed?: boolean;
}

export default function Home() {
  const [mood, setMood] = useState<string>('');
  const [energy, setEnergy] = useState<number>(3);
  const [availableTime, setAvailableTime] = useState<number | ''>('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch(`${API_URL}/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'healthy') {
            setBackendStatus('connected');
          } else {
            setBackendStatus('error');
            setError('Backend is not healthy');
          }
        } else {
          setBackendStatus('error');
          setError('Failed to connect to backend');
        }
      } catch (err) {
        setBackendStatus('error');
        setError('Backend connection failed. Please make sure the backend server is running.');
        console.error('Backend health check failed:', err);
      }
    };

    checkBackendHealth();
    // Check health every 5 seconds
    const interval = setInterval(checkBackendHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const moodOptions = [
    'energetic', 'tired', 'anxious', 'motivated', 
    'stressed', 'calm', 'focused', 'distracted'
  ];

  const goalOptions = [
    'study', 'work', 'exercise', 'relax',
    'socialize', 'create', 'learn', 'meditate'
  ];

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const generatePlan = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/generate-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood,
          energy,
          available_time: availableTime,
          goals: selectedGoals,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate plan');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Ensure plan is an array
      if (!Array.isArray(data.plan)) {
        throw new Error('Invalid plan format received from server');
      }
      
      setPlan(data.plan);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      setPlan([]); // Reset plan to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = (index: number) => {
    setPlan(prevPlan => {
      const newPlan = [...prevPlan];
      newPlan[index] = {
        ...newPlan[index],
        completed: !newPlan[index].completed
      };
      return newPlan;
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-8xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent mb-6">
            AI Planner Buddy
          </h1>
          <p className="text-3xl text-gray-300 font-medium">
            Your intelligent assistant to plan your day based on how you feel!
          </p>
          {backendStatus === 'checking' && (
            <p className="text-2xl text-blue-400 mt-4 font-medium">Checking backend connection...</p>
          )}
          {backendStatus === 'error' && (
            <p className="text-2xl text-red-400 mt-4 font-medium">Backend connection failed. Please make sure the backend server is running.</p>
          )}
        </motion.div>

        <div className="bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 mb-10">
          <div className="space-y-10">
            <div>
              <label className="block text-3xl font-semibold text-gray-200 mb-6">
                How are you feeling today?
              </label>
              <div className="grid grid-cols-4 gap-4">
                {moodOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setMood(option)}
                    className={`p-6 rounded-xl text-xl font-medium transition-all transform hover:scale-105 ${
                      mood === option
                        ? 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-lg'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-200 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-3xl font-semibold text-gray-200 mb-6">
                Energy Level (1-5)
              </label>
              <div className="flex space-x-6">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setEnergy(level)}
                    className={`w-20 h-20 rounded-2xl text-2xl font-medium transition-all transform hover:scale-105 ${
                      energy === level
                        ? 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-lg'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-200 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-3xl font-semibold text-gray-200 mb-6">
                Available Time (hours)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={availableTime}
                onChange={(e) => setAvailableTime(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Enter hours"
                className="w-full p-6 text-2xl text-gray-200 bg-gray-700 border-2 border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-md placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-3xl font-semibold text-gray-200 mb-6">
                What would you like to do today?
              </label>
              <div className="grid grid-cols-4 gap-4">
                {goalOptions.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => handleGoalToggle(goal)}
                    className={`p-6 rounded-xl text-xl font-medium transition-all transform hover:scale-105 ${
                      selectedGoals.includes(goal)
                        ? 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-lg'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-200 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-2xl text-red-400 text-center font-medium">
                {error}
              </div>
            )}

            <button
              onClick={generatePlan}
              disabled={loading || !mood || backendStatus !== 'connected'}
              className={`w-full py-6 rounded-xl text-2xl font-semibold transition-all transform hover:scale-102 ${
                loading || !mood || backendStatus !== 'connected'
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? 'Generating your plan...' : 'Generate My Plan'}
            </button>
          </div>
        </div>

        {plan.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gray-800 rounded-lg shadow-lg p-8"
          >
            <h2 className="text-3xl font-bold text-gray-200 mb-6">Your Personalized Plan</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-8 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Time</th>
                    <th className="px-8 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Activity</th>
                    <th className="px-8 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Description</th>
                    <th className="px-8 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Duration</th>
                    <th className="px-8 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Priority</th>
                    <th className="px-8 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {plan.map((item, index) => (
                    <tr key={index} className={item.completed ? 'bg-gray-700' : ''}>
                      <td className="px-8 py-6 whitespace-nowrap text-lg text-gray-200">{item.time}</td>
                      <td className="px-8 py-6 whitespace-nowrap text-lg font-medium text-gray-200">{item.activity}</td>
                      <td className="px-8 py-6 text-lg text-gray-300">{item.description}</td>
                      <td className="px-8 py-6 whitespace-nowrap text-lg text-gray-300">{item.duration} min</td>
                      <td className="px-8 py-6 whitespace-nowrap text-lg text-gray-300">
                        <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                          item.priority === 1 ? 'bg-red-900 text-red-200' :
                          item.priority === 2 ? 'bg-yellow-900 text-yellow-200' :
                          'bg-green-900 text-green-200'
                        }`}>
                          {item.priority === 1 ? 'High' : item.priority === 2 ? 'Medium' : 'Low'}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-lg text-gray-300">
                        <input
                          type="checkbox"
                          checked={item.completed || false}
                          onChange={() => handleTaskComplete(index)}
                          className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-red-900/50 rounded-lg shadow-lg p-8"
          >
            <p className="text-2xl text-red-300 font-medium">{error}</p>
          </motion.div>
        ) : null}
      </div>
    </main>
  );
}
