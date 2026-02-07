"use client"

import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp, DollarSign, BrainCircuit, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card'
import { Badge } from '@/components/shared/ui/badge'
import Link from 'next/link'
import { insightsData } from '@/data/insights'

export default function IndustryInsights() {
  // Use the first 3 items from the shared data source
  const insights = insightsData.slice(0, 3)

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-12 gap-6">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              BPO <span className="gradient-text">Intelligence</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Stay ahead of the curve with our data-driven insights on salaries, skills, and industry shifts.
            </p>
          </div>
            <Link href="/insights">
              <button className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 font-mono text-sm group">
                VIEW_ALL_REPORTS <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {insights.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/insights/${item.slug}`}>
                <Card className="glass-card bg-slate-900/40 backdrop-blur-xl border-white/10 h-full hover:border-white/20 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.bgColor} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  
                  <CardHeader>
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="outline" className="border-white/10 text-gray-400 font-mono text-xs">
                        {item.category}
                      </Badge>
                      <div className="flex items-center text-xs text-gray-500 gap-1 font-mono">
                        <Calendar className="w-3 h-3" /> {item.date}
                      </div>
                    </div>
                    <CardTitle className="text-xl text-white group-hover:text-cyan-400 transition-colors line-clamp-2 min-h-[3.5rem]">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    <CardDescription className="text-gray-400 line-clamp-3 mb-6 flex-1">
                      {item.description}
                    </CardDescription>
                    
                    <div className="flex items-center gap-2 text-sm font-medium text-white/50 group-hover:text-white transition-colors mt-auto">
                      Read Report <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

