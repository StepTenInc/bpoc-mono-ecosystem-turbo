'use client'

import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import Header from '@/components/shared/layout/Header'

export default function ContactSupportPage() {
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
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">Contact Support</div>
              <div className="text-sm text-gray-400">Get in touch with our team</div>
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

            {/* Support Channels */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Support Channels</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">IT Support & Technical Issues</h3>
                  </div>
                  <div className="space-y-3 text-gray-300">
                    <div>
                      <strong className="text-gray-200">Email:</strong>
                      <div className="mt-1">it@shoreagents.com</div>
                    </div>
                    <div>
                      <strong className="text-gray-200">Attention:</strong>
                      <div className="mt-1">Data Protection Officer (Stephen Philip Atcheler)</div>
                    </div>
                    <div>
                      <strong className="text-gray-200">Response Time:</strong>
                      <div className="mt-1">Within 5 business days</div>
                    </div>
                    <div className="pt-3 border-t border-gray-700">
                      <p className="text-sm text-gray-400">For platform technical issues, data protection inquiries, and security concerns.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Recruitment Team</h3>
                  </div>
                  <div className="space-y-3 text-gray-300">
                    <div>
                      <strong className="text-gray-200">Email:</strong>
                      <div className="mt-1">recruitment@shoreagents.com</div>
                    </div>
                    <div>
                      <strong className="text-gray-200">Phone:</strong>
                      <div className="mt-1">+63 917 702 0676</div>
                    </div>
                    <div>
                      <strong className="text-gray-200">Hours:</strong>
                      <div className="mt-1">Monday-Friday, 6am to 3pm (Philippine Time)</div>
                    </div>
                    <div className="pt-3 border-t border-gray-700">
                      <p className="text-sm text-gray-400">For application status, interview scheduling, and recruitment inquiries.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Careers Team</h3>
                  </div>
                  <div className="space-y-3 text-gray-300">
                    <div>
                      <strong className="text-gray-200">Email:</strong>
                      <div className="mt-1">careers@shoreagents.com</div>
                    </div>
                    <div>
                      <strong className="text-gray-200">Phone:</strong>
                      <div className="mt-1">+63 917 702 0676</div>
                    </div>
                    <div>
                      <strong className="text-gray-200">Hours:</strong>
                      <div className="mt-1">Monday-Friday, 6am to 3pm (Philippine Time)</div>
                    </div>
                    <div className="pt-3 border-t border-gray-700">
                      <p className="text-sm text-gray-400">For general career inquiries, job opportunities, and platform usage questions.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Office Location</h3>
                  </div>
                  <div className="space-y-3 text-gray-300">
                    <div>
                      <strong className="text-gray-200">Company:</strong>
                      <div className="mt-1">ShoreAgents Inc.</div>
                    </div>
                    <div>
                      <strong className="text-gray-200">Address:</strong>
                      <div className="mt-1">
                        Business Center 26, Philexcel Business Park<br />
                        Ma Roxas Highway, Clark Freeport<br />
                        2023 Pampanga, Philippines
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-700">
                      <p className="text-sm text-gray-400">For in-person inquiries, please contact us in advance to schedule an appointment.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Times */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Response Times</h2>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <div className="space-y-4 text-gray-300">
                  <div>
                    <strong className="text-gray-200">General Inquiries:</strong>
                    <div className="mt-1">Within 2-3 business days</div>
                  </div>
                  <div>
                    <strong className="text-gray-200">Technical Support:</strong>
                    <div className="mt-1">Within 5 business days</div>
                  </div>
                  <div>
                    <strong className="text-gray-200">Urgent Matters:</strong>
                    <div className="mt-1">Please call +63 917 702 0676 during business hours</div>
                  </div>
                  <div>
                    <strong className="text-gray-200">Data Protection Requests:</strong>
                    <div className="mt-1">Within 5 business days (as required by law)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Business Hours</h2>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-6 h-6 text-yellow-400" />
                  <div>
                    <div className="text-lg font-semibold text-white">Monday - Friday</div>
                    <div className="text-gray-300">6:00 AM - 3:00 PM (Philippine Time)</div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-gray-300 text-sm">
                    Our offices are closed on weekends and Philippine national holidays. 
                    Emails sent outside business hours will be responded to on the next business day.
                  </p>
                </div>
              </div>
            </div>

            {/* Document Information */}
            <div className="text-center py-8 border-t border-gray-700">
              <div className="space-y-2 text-sm text-gray-400">
                <p>
                  <strong>Last Updated:</strong> August 28, 2025
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

