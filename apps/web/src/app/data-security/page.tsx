'use client'

import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import Header from '@/components/shared/layout/Header'

export default function DataSecurityPage() {
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
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">Data Security</div>
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

            {/* Our Commitment to Security */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Our Commitment to Security</h2>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <p className="text-gray-300 mb-4">
                  At ShoreAgents Inc., we take data security seriously. We implement industry-standard security measures 
                  to protect your personal information and ensure the confidentiality, integrity, and availability of all data 
                  stored on our platform.
                </p>
                <p className="text-gray-300">
                  This document outlines our comprehensive security practices and measures designed to safeguard your information.
                </p>
              </div>
            </div>

            {/* Technical Safeguards */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Technical Safeguards</h2>
              
              <h3 className="text-xl font-semibold text-gray-200 mb-4">Encryption</h3>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 mb-6">
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li><strong>SSL/HTTPS Encryption:</strong> All data transmission between your device and our servers is encrypted using industry-standard SSL/TLS protocols</li>
                  <li><strong>Data at Rest:</strong> All stored personal information is encrypted using advanced encryption algorithms</li>
                  <li><strong>Database Encryption:</strong> Sensitive data fields are encrypted at the database level</li>
                  <li><strong>Password Security:</strong> Passwords are hashed using secure, one-way cryptographic functions</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-200 mb-4">Access Controls</h3>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 mb-6">
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li><strong>Multi-Factor Authentication:</strong> Required for all administrative and staff access to the platform</li>
                  <li><strong>Role-Based Access:</strong> Staff can only access data necessary for their job functions</li>
                  <li><strong>User Authentication:</strong> Secure login systems with session management and timeout features</li>
                  <li><strong>Access Logging:</strong> All access to sensitive data is logged and monitored</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-200 mb-4">Network Security</h3>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 mb-6">
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li><strong>Firewalls:</strong> Network firewalls protect our infrastructure from unauthorized access</li>
                  <li><strong>Intrusion Detection:</strong> Automated systems monitor for suspicious activity and potential threats</li>
                  <li><strong>DDoS Protection:</strong> Protection against distributed denial-of-service attacks</li>
                  <li><strong>Regular Security Updates:</strong> All systems are kept up-to-date with the latest security patches</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-200 mb-4">Infrastructure Security</h3>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li><strong>Secure Cloud Hosting:</strong> Data is stored on reputable cloud infrastructure providers with high security standards</li>
                  <li><strong>Backup Systems:</strong> Regular automated backups with encrypted storage and disaster recovery procedures</li>
                  <li><strong>Physical Security:</strong> Server facilities are protected by physical security measures</li>
                  <li><strong>Monitoring:</strong> 24/7 monitoring of system performance and security events</li>
                </ul>
              </div>
            </div>

            {/* Organizational Safeguards */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Organizational Safeguards</h2>
              
              <h3 className="text-xl font-semibold text-gray-200 mb-4">Staff Training</h3>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 mb-6">
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>All staff receive comprehensive training on data protection and security practices</li>
                  <li>Regular security awareness updates and best practices training</li>
                  <li>Training on recognizing and responding to security threats</li>
                  <li>Confidentiality agreements for all employees with access to personal data</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-200 mb-4">Access Policies</h3>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 mb-6">
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>Strict data access policies limiting access to authorized personnel only</li>
                  <li>Principle of least privilege - staff only have access to data necessary for their role</li>
                  <li>Regular access reviews and audits</li>
                  <li>Immediate revocation of access upon employee termination or role change</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-200 mb-4">Incident Response</h3>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>Comprehensive incident response plan for security breaches</li>
                  <li>Designated security team responsible for incident management</li>
                  <li>Procedures for containment, investigation, and recovery</li>
                  <li>Notification procedures in case of data breaches (as required by law)</li>
                </ul>
              </div>
            </div>

            {/* Data Retention & Disposal */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Data Retention & Disposal</h2>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-gray-200 mb-4">Retention Policies</h3>
                <ul className="list-disc pl-6 mb-4 text-gray-300 space-y-2">
                  <li>Personal data is retained only as long as necessary for recruitment purposes</li>
                  <li>Data from unsuccessful applications may be retained for up to 2 years for potential future opportunities</li>
                  <li>Data from successful hires is retained according to employment record requirements</li>
                  <li>You may request deletion of your data at any time (subject to legal requirements)</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-gray-200 mb-4 mt-6">Secure Disposal</h3>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>When data is no longer needed, it is securely deleted using industry-standard methods</li>
                  <li>Physical records are securely shredded</li>
                  <li>Digital data is permanently erased using secure deletion methods</li>
                  <li>Backup systems are updated to remove deleted data</li>
                </ul>
              </div>
            </div>

            {/* Third-Party Security */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Third-Party Security</h2>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <p className="text-gray-300 mb-4">
                  We work with trusted third-party service providers for platform hosting, authentication, and other services. 
                  All third-party providers are required to:
                </p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>Maintain industry-standard security certifications</li>
                  <li>Comply with data protection regulations</li>
                  <li>Implement appropriate security measures</li>
                  <li>Sign confidentiality and data processing agreements</li>
                  <li>Undergo regular security assessments</li>
                </ul>
              </div>
            </div>

            {/* Your Role in Security */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Your Role in Security</h2>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <p className="text-gray-300 mb-4">
                  While we implement comprehensive security measures, you also play an important role in protecting your information:
                </p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li><strong>Strong Passwords:</strong> Use a unique, strong password for your account</li>
                  <li><strong>Account Security:</strong> Never share your login credentials with anyone</li>
                  <li><strong>Secure Devices:</strong> Ensure your device has up-to-date security software</li>
                  <li><strong>Logout:</strong> Always log out when using shared or public devices</li>
                  <li><strong>Report Issues:</strong> Immediately report any suspicious activity or security concerns</li>
                </ul>
              </div>
            </div>

            {/* Security Updates */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Security Updates & Monitoring</h2>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Continuous monitoring of security systems and logs</li>
                  <li>Regular updates to security policies and procedures</li>
                  <li>Compliance reviews to ensure adherence to security standards</li>
                  <li>Penetration testing to identify and address potential vulnerabilities</li>
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
                  Our security practices comply with:
                </p>
                <ul className="list-disc pl-6 mb-6 text-gray-300 space-y-2">
                  <li>Republic Act 10173 (Data Privacy Act of 2012)</li>
                  <li>National Privacy Commission (NPC) guidelines</li>
                  <li>Industry best practices and security standards</li>
                  <li>International data protection frameworks</li>
                </ul>
              </div>
            </div>

            {/* Document Version Information */}
            <div className="text-center py-8 border-t border-gray-700">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <span className="px-3 py-1 bg-blue-900/50 text-blue-200 text-sm font-medium rounded-full border border-blue-700">Secure</span>
                <span className="px-3 py-1 bg-green-900/50 text-green-200 text-sm font-medium rounded-full border border-green-700">Compliant</span>
                <span className="px-3 py-1 bg-purple-900/50 text-purple-200 text-sm font-medium rounded-full border border-purple-700">Protected</span>
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

