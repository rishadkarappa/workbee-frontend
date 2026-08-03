import type { SystemMessagePayload } from "./SystemMessage";


// ── Parse helper (now accepts bid types too) ───────────────────────
export function parseSystemMessage(content: string): SystemMessagePayload | null {
    try {
        const parsed = JSON.parse(content);
        const validTypes = [
            'WORK_CONFIRM_REQUEST', 'WORK_CONFIRM_ACCEPTED', 'WORK_CONFIRM_REJECTED', 'WORK_PROGRESS_UPDATE',
            'WORK_BID_OFFER', 'WORK_BID_COUNTER', 'WORK_BID_ACCEPTED', 'WORK_BID_REJECTED', 'WORK_BID_PAID',
        ];
        if (validTypes.includes(parsed?.type)) return parsed as SystemMessagePayload;
        return null;
    } catch {
        return null;
    }
}

// ── Staleness helper: is this bid-related card still the "live" one for its workId? ──
export function isBidCardActionable(messages: { id: string; content: string; type: string }[], targetId: string): boolean {
    const targetIndex = messages.findIndex(m => m.id === targetId);
    if (targetIndex === -1) return true;
    const targetPayload = parseSystemMessage(messages[targetIndex].content);
    if (!targetPayload || !('workId' in targetPayload)) return true;
    const workId = targetPayload.workId;

    for (let i = targetIndex + 1; i < messages.length; i++) {
        const p = parseSystemMessage(messages[i].content);
        if (p && 'workId' in p && p.workId === workId) {
            if (['WORK_BID_OFFER', 'WORK_BID_COUNTER', 'WORK_BID_ACCEPTED', 'WORK_BID_REJECTED', 'WORK_BID_PAID'].includes(p.type)) {
                return false; // a newer bid event exists — this card is resolved/stale
            }
        }
    }
    return true;
}