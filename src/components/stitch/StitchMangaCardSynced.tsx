"use client";

import React, { useEffect, useState } from 'react';
import { StitchMangaCard, StitchMangaCardProps } from './StitchMangaCard';
import { useAniList } from '@/hooks/useAniList';

export function StitchMangaCardSynced(props: StitchMangaCardProps) {
    const { getProgress, status } = useAniList();
    const [progressInfo, setProgressInfo] = useState<any>(null);

    useEffect(() => {
        if (status === "connected") {
            getProgress(props.slug, props.title).then(info => {
                if (info) setProgressInfo(info);
            });
        }
    }, [status, props.slug, props.title, getProgress]);

    const displayProps = {
        ...props,
        isSynced: !!progressInfo,
        latestChapter: progressInfo 
            ? `Ch. ${progressInfo.progress}${progressInfo.media.chapters ? ` / ${progressInfo.media.chapters}` : ''}`
            : props.latestChapter
    };

    return <StitchMangaCard {...displayProps} />;
}
