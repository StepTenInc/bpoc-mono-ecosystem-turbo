'use client'

import { motion } from 'framer-motion'
import { Cookie } from 'lucide-react'
import Header from '@/components/shared/layout/Header'

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100">
      <Header />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center mb-12"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Cookie className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">Cookie Policy</div>
              <div className="text-sm text-gray-400">Last updated: August 28, 2025</div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="prose prose-lg max-w-none prose-invert"
          >
            {/* Company Information */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Company Information</h2>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div><strong className="text-gray-300">Company:</strong> <span className="text-gray-100">ShoreAgents Inc.</span></div>
                    <div><strong className="text-gray-300">Registration:</strong> <span className="text-gray-100">SEC CS201918140 | TIN 010-425-223-00000</span></div>
                    <div><strong className="text-gray-300">Phone:</strong> <span className="text-gray-100">+63 917 702 0676</span></div>
                  </div>
                  <div className="space-y-3">
                    <div><strong className="text-gray-300">Email:</strong> <span className="text-gray-100">careers@shoreagents.com</span></div>
                    <div><strong className="text-gray-300">Website:</strong> <span className="text-gray-100">https://shoreagents.com</span></div>
                    <div><strong className="text-gray-300">Careers Website:</strong> <span className="text-gray-100">https://careers.shoreagents.com</span></div>
                    <div><strong className="text-gray-300">Platform:</strong> <span className="text-gray-100">https://bpoc.io</span></div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div><strong className="text-gray-300">Address:</strong></div>
                  <div className="text-gray-100 mt-1">
                    Business Center 26, Philexcel Business Park, Ma Roxas Highway, Clark Freeport, 2023 Pampanga
                  </div>
                </div>
              </div>
            </div>

            {/* About Our Platform */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">About Our Platform</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Our recruitment platform at <strong className="text-blue-400">bpoc.io</strong> is ShoreAgents Inc.'s internal hiring tool designed to streamline our recruitment process and connect with qualified BPO professionals seeking employment with our company.
              </p>
              <div className="bg-yellow-900/30 border-l-4 border-yellow-500 p-4">
                <p className="text-yellow-200 font-medium">
                  By using this platform, you are applying for potential employment with ShoreAgents Inc.
                </p>
              </div>
            </div>

            {/* What Are Cookies */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">What Are Cookies?</h2>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <p className="text-gray-300 mb-4">
                  Cookies are small text files that are placed on your device (computer, tablet, or mobile) when you visit our platform. 
                  They help us provide you with a better experience and allow certain features to function properly.
                </p>
                <p className="text-gray-300">
                  Cookies can be "persistent" (remain on your device until deleted or expired) or "session" cookies (deleted when you close your browser).
                </p>
              </div>
            </div>

            {/* Types of Cookies We Use */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-semibold text-gray-200 mb-4">Essential Cookies</h3>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 mb-6">
                <p className="text-gray-300 mb-4">
                  These cookies are necessary for the platform to function properly. They enable core functionality such as:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-300 space-y-2">
                  <li>User authentication and login sessions</li>
                  <li>Security features and fraud prevention</li>
                  <li>Remembering your preferences and settings</li>
                  <li>Maintaining your session while using the platform</li>
                </ul>
                <p className="text-gray-300 text-sm">
                  <strong>Note:</strong> These cookies cannot be disabled as they are essential for platform operation.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-200 mb-4">Functional Cookies</h3>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 mb-6">
                <p className="text-gray-300 mb-4">
                  These cookies enhance your experience by remembering:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-300 space-y-2">
                  <li>Your language preferences</li>
                  <li>Assessment progress and completion status</li>
                  <li>Profile settings and customizations</li>
                  <li>Game scores and achievements</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-200 mb-4">Analytics Cookies</h3>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 mb-6">
                <p className="text-gray-300 mb-4">
                  We use analytics cookies to understand how users interact with our platform. This helps us:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-300 space-y-2">
                  <li>Improve platform functionality and user experience</li>
                  <li>Identify technical issues and optimize performance</li>
                  <li>Analyze assessment effectiveness (using anonymized data)</li>
                  <li>Enhance security measures</li>
                </ul>
                <p className="text-gray-300 text-sm">
                  <strong>Note:</strong> All analytics data is anonymized and cannot be used to identify individual users.
                </p>
              </div>
            </div>

            {/* Third-Party Cookies */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Third-Party Cookies</h2>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <p className="text-gray-300 mb-4">
                  Our platform may use services from trusted third-party providers that set their own cookies:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-300 space-y-2">
                  <li><strong>Authentication Services:</strong> For secure login and user management</li>
                  <li><strong>Cloud Infrastructure:</strong> For platform hosting and data storage</li>
                  <li><strong>Security Services:</strong> For fraud detection and security monitoring</li>
                </ul>
                <p className="text-gray-300 text-sm">
                  These third-party cookies are subject to the respective providers' privacy policies. 
                  We only work with reputable service providers that maintain high security and privacy standards.
                </p>
              </div>
            </div>

            {/* Cookie Management */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Managing Your Cookie Preferences</h2>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-gray-200 mb-4">Browser Settings</h3>
                <p className="text-gray-300 mb-4">
                  You can control cookies through your browser settings. Most browsers allow you to:
                </p>
                <ul className="list-disc pl-6 mb-6 text-gray-300 space-y-2">
                  <li>View and delete cookies stored on your device</li>
                  <li>Block cookies from specific websites</li>
                  <li>Block all cookies</li>
                  <li>Delete all cookies when you close your browser</li>
                </ul>
                <div className="bg-yellow-900/30 border-l-4 border-yellow-500 p-4">
                  <p className="text-yellow-200 font-medium text-sm">
                    <strong>Important:</strong> Disabling essential cookies may prevent the platform from functioning properly. 
                    You may not be able to log in, complete assessments, or access certain features.
                  </p>
                </div>
              </div>
            </div>

            {/* Data Retention */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Cookie Retention</h2>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                  <li><strong>Authentication Cookies:</strong> Typically expire after 30 days of inactivity</li>
                  <li><strong>Preference Cookies:</strong> May persist for up to 1 year</li>
                  <li><strong>Analytics Cookies:</strong> Typically expire after 2 years</li>
                </ul>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Contact Us</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h4 className="font-semibold text-gray-200 mb-2">IT Support & Data Protection</h4>
                  <div className="space-y-1 text-sm text-gray-300">
                    <div><strong>Email:</strong> it@shoreagents.com</div>
                    <div><strong>Attention:</strong> Data Protection Officer (Stephen Philip Atcheler)</div>
                    <div><strong>Response Time:</strong> Within 5 business days</div>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h4 className="font-semibold text-gray-200 mb-2">Recruitment Team</h4>
                  <div className="space-y-1 text-sm text-gray-300">
                    <div><strong>Email:</strong> recruitment@shoreagents.com</div>
                    <div><strong>Phone:</strong> +63 917 702 0676</div>
                    <div><strong>Hours:</strong> Monday-Friday, 6am to 3pm (Philippine Time)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Compliance */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Legal Compliance</h2>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <p className="text-gray-300 mb-4">
                  This cookie policy complies with:
                </p>
                <ul className="list-disc pl-6 mb-6 text-gray-300 space-y-2">
                  <li>Republic Act 10173 (Data Privacy Act of 2012)</li>
                  <li>National Privacy Commission (NPC) guidelines</li>
                  <li>International best practices for cookie usage</li>
                </ul>
              </div>
            </div>

            {/* Document Version Information */}
            <div className="text-center py-8 border-t border-gray-700">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <span className="px-3 py-1 bg-blue-900/50 text-blue-200 text-sm font-medium rounded-full border border-blue-700">Secure</span>
                <span className="px-3 py-1 bg-green-900/50 text-green-200 text-sm font-medium rounded-full border border-green-700">Compliant</span>
                <span className="px-3 py-1 bg-purple-900/50 text-purple-200 text-sm font-medium rounded-full border border-purple-700">Transparent</span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-400">
                <p>
                  <strong>Document Version:</strong> 1.0 | <strong>Next Review Date:</strong> February 28, 2026
                </p>
                <p>
                  <strong>Approved By:</strong> Stephen Philip Atcheler, Data Protection Officer
                </p>
                <p>
                  © 2025 ShoreAgents Inc. All rights reserved.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

