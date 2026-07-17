import { fetchLeaderboard } from '../content.js';
import { localize } from '../util.js';

import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
        packs: [],
        levels: [],
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
                    </p>
                </div>
                <div class="board-container">
                    <table class="board">
                        <tr v-for="(ientry, i) in leaderboard">
                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>
                            <td class="total">
                                <p class="type-label-lg">{{ ientry.total }}</p>
                            </td>
                            <td class="user" :class="{ 'active': selected == i }">
                                <button @click="selected = i">
                                    <span class="type-label-lg">{{ ientry.user }}</span>
                                </button>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="player-container">
                    <div class="player">
                        <h1>#{{ selected + 1 }} {{ entry.user }}</h1>
                        <h3>{{ entry.total }}</h3>
                        <div v-if="completedPacks.length" class="user-packs" style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1.5rem;">
                            <span v-for="pack in completedPacks" :key="pack.id" class="pack-badge type-label-lg" :style="{ background: pack.color || 'var(--color-primary)', color: 'white', padding: '0.4em 1em', borderRadius: '0.7em' }">{{ pack.name }}</span>
                        </div>
                        <h2 v-if="entry.verified.length > 0">Verified ({{ entry.verified.length}})</h2>
                        <table class="table">
                            <tr v-for="score in entry.verified">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>{{ score.displayTime }}</p>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="entry.completed.length > 0">Completed ({{ entry.completed.length }})</h2>
                        <table class="table">
                            <tr v-for="score in entry.completed">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>{{ score.displayTime }}</p>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="entry.progressed.length > 0">Progressed ({{entry.progressed.length}})</h2>
                        <table class="table">
                            <tr v-for="score in entry.progressed">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>{{ score.displayTime }}</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    `,
    computed: {
        entry() {
            return this.leaderboard[this.selected] || { user: '', total: 0, verified: [], completed: [], progressed: [] };
        },
        completedPacks() {
            if (!this.levels.length || !this.packs.length || !this.entry) return [];
            const user = this.entry.user;
            return this.packs.filter(pack => {
                if (pack.id === 'all' || pack.id === 'top5' || pack.id === 'top10') return false;
                const packLevels = this.levels.filter(l => Array.isArray(l.inwhatpack) && l.inwhatpack.includes(pack.id));
                return packLevels.length > 0 && packLevels.every(l => (
                    (Array.isArray(l.records) && l.records.some(r => r.user && r.user.toLowerCase() === user.toLowerCase() && r.percent === 100))
                    || (l.verifier && l.verifier.toLowerCase() === user.toLowerCase())
                ));
            });
        }
    },
    async mounted() {
        const [leaderboard, err] = await fetchLeaderboard('platformer');
        this.leaderboard = leaderboard;
        this.err = err;
        try {
            const packsRes = await fetch('/data/packs.json');
            this.packs = await packsRes.json();
        } catch {}
        try {
            const listRes = await fetch('/platdata/_platlist.json');
            if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`);
            const list = await listRes.json();
            this.levels = await Promise.all(list.map(async (path) => {
                const res = await fetch(`/platdata/${path}.json`);
                return await res.json();
            }));
            
            const userRecords = {};
            this.levels.forEach(level => {
                level.records?.forEach(record => {
                    if (!userRecords[record.user]) {
                        userRecords[record.user] = {
                            user: record.user,
                            total: 0,
                            verified: [],
                            completed: [],
                            progressed: []
                        };
                    }
                    userRecords[record.user].total++;
                    
                    // Generate clean display layout right here during data assembly
                    let cleanTime = '--:--';
                    if (record.time !== undefined && record.time !== null) {
                        const rawSecs = parseFloat(record.time);
                        if (!isNaN(rawSecs) && rawSecs > 0) {
                            const mins = Math.floor(rawSecs / 60);
                            const remainder = rawSecs % 60;
                            if (remainder % 1 === 0) {
                                cleanTime = `${mins}:${remainder.toString().padStart(2, '0')}`;
                            } else {
                                cleanTime = `${mins}:${remainder.toFixed(2).padStart(5, '0')}`;
                            }
                        }
                    }

                    const recordPayload = {
                        rank: userRecords[record.user].total,
                        level: level.name,
                        link: record.link,
                        percent: record.percent,
                        time: record.time || 0,
                        displayTime: cleanTime // Saved directly into payload object
                    };

                    if (record.percent === 100 || !record.percent) {
                        userRecords[record.user].completed.push(recordPayload);
                    } else {
                        userRecords[record.user].progressed.push(recordPayload);
                    }
                });
            });
            this.leaderboard = Object.values(userRecords).sort((a, b) => b.total - a.total);
            
        } catch (e) {
            console.error('Failed to load platformer levels:', e);
        }
        this.loading = false;
    },
    methods: {
        localize
    },
};