/**
 * HR Assistant Demo Page
 * 
 * Test page for the HR Assistant component
 * Remove or protect this in production
 */

import { HRAssistant } from '@/components/hr/HRAssistant';

export default function HRAssistantDemo() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">HR Assistant Demo</h1>
          <p className="text-gray-600">
            AI-powered Philippine Labor Law assistant for all roles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidate */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 text-white px-4 py-2">
              <h3 className="font-bold">Candidate View</h3>
              <p className="text-xs">Employee rights & benefits</p>
            </div>
            <div className="h-[600px]">
              <HRAssistant role="candidate" />
            </div>
          </div>

          {/* Recruiter */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-600 text-white px-4 py-2">
              <h3 className="font-bold">Recruiter View</h3>
              <p className="text-xs">Hiring & compliance</p>
            </div>
            <div className="h-[600px]">
              <HRAssistant role="recruiter" />
            </div>
          </div>

          {/* Admin */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-purple-600 text-white px-4 py-2">
              <h3 className="font-bold">Admin View</h3>
              <p className="text-xs">Legal & regulations</p>
            </div>
            <div className="h-[600px]">
              <HRAssistant role="admin" />
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-bold mb-2">Semantic Search</h3>
              <p className="text-sm text-gray-600">
                Uses AI embeddings to understand the meaning of your question, not just keywords
              </p>
            </div>

            <div>
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="font-bold mb-2">Role-Based</h3>
              <p className="text-sm text-gray-600">
                Content filtered by relevance - candidates see employee rights, recruiters see compliance
              </p>
            </div>

            <div>
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="font-bold mb-2">Full Labor Code</h3>
              <p className="text-sm text-gray-600">
                Covers the entire Philippine Labor Code with article-level precision
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

