'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MailX
} from 'lucide-react';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  is_registered: boolean;
  email_valid: boolean;
  unsubscribed: boolean;
  total_emails_sent: number;
  last_email_sent_at: string | null;
  created_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filterRegistered, setFilterRegistered] = useState<string>('all');
  const [filterValid, setFilterValid] = useState<string>('all');
  const [filterUnsubscribed, setFilterUnsubscribed] = useState<string>('false');

  useEffect(() => {
    fetchContacts();
  }, [page, search, filterRegistered, filterValid, filterUnsubscribed]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (search) params.append('search', search);
      if (filterRegistered !== 'all') params.append('is_registered', filterRegistered);
      if (filterValid !== 'all') params.append('email_valid', filterValid);
      if (filterUnsubscribed !== 'all') params.append('unsubscribed', filterUnsubscribed);

      const response = await fetch(`/api/admin/outbound/contacts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const response = await fetch(`/api/admin/outbound/contacts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchContacts();
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Contacts</h1>
          <p className="text-gray-400">
            {total.toLocaleString()} total contacts in database
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-400 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Email or name..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Registered Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Registration</label>
            <select
              value={filterRegistered}
              onChange={(e) => {
                setFilterRegistered(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All</option>
              <option value="true">Registered</option>
              <option value="false">Not Registered</option>
            </select>
          </div>

          {/* Valid Email Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email Status</label>
            <select
              value={filterValid}
              onChange={(e) => {
                setFilterValid(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All</option>
              <option value="true">Valid</option>
              <option value="false">Invalid</option>
            </select>
          </div>

          {/* Unsubscribed Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Subscription</label>
            <select
              value={filterUnsubscribed}
              onChange={(e) => {
                setFilterUnsubscribed(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All</option>
              <option value="false">Subscribed</option>
              <option value="true">Unsubscribed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No contacts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-white/10">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Contact</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Phone</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Emails Sent</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Last Contact</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {(contact.first_name?.[0] || contact.email[0]).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {contact.first_name && contact.last_name
                              ? `${contact.first_name} ${contact.last_name}`
                              : contact.first_name || contact.last_name || 'No name'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">{contact.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {contact.phone_number ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">{contact.phone_number}</span>
                        </div>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {contact.is_registered && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                            <CheckCircle className="h-3 w-3" />
                            Registered
                          </span>
                        )}
                        {!contact.email_valid && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                            <XCircle className="h-3 w-3" />
                            Invalid
                          </span>
                        )}
                        {contact.unsubscribed && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs font-medium">
                            <MailX className="h-3 w-3" />
                            Unsubscribed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300">{contact.total_emails_sent}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm">
                        {formatDate(contact.last_email_sent_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.location.href = `/admin/outbound/contacts/${contact.id}`}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && contacts.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, total)} of {total} contacts
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-white font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
