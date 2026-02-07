'use client';

import { Avatar, AvatarFallback } from '@/components/shared/ui/avatar';
import { Button } from '@/components/shared/ui/button';
import Link from 'next/link';
import Image from 'next/image';

interface AuthorBioProps {
  authorName: string;
  authorSlug: string;
}

export default function AuthorBio({ authorName, authorSlug }: AuthorBioProps) {
  // Ate Yna's avatar path
  const isAteYna = authorSlug === 'ate-yna';

  return (
    <div className="flex items-start gap-4 p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm mt-12 mb-12">
      <Link href={`/author/${authorSlug}`}>
        <Avatar className="w-16 h-16 border-2 border-electric-purple cursor-pointer transition-transform hover:scale-105 overflow-hidden">
          {isAteYna ? (
            <Image 
              src="/Chat Agent/Ate Yna.png" 
              alt={`${authorName} avatar`}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xl">
              {authorName.charAt(0)}
            </AvatarFallback>
          )}
        </Avatar>
      </Link>
      
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <Link href={`/author/${authorSlug}`}>
            <h3 className="text-lg font-bold text-white hover:text-cyan-400 transition-colors cursor-pointer">
              {authorName}
            </h3>
          </Link>
          <Link href={`/author/${authorSlug}`}>
            <Button variant="link" className="text-cyan-400 text-xs h-auto p-0">
              View Profile
            </Button>
          </Link>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          {authorSlug === 'ate-yna' 
            ? "Your supportive career 'ate' from the BPO industry. Sharing real talk, tips, and the occasional hug (virtually)." 
            : "BPO Industry Expert & Contributor."}
        </p>
      </div>
    </div>
  );
}

