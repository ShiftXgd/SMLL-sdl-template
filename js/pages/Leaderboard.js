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
                                <p class="type-label-lg">{{ localize(ientry.total) }}</p>
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
                                    <p>+{{ localize(score.score) }}</p>
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
                                    <p>+{{ localize(score.score) }}</p>
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
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.percent }}% {{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
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
            return this.leaderboard[this.selected];
        },
        completedPacks() {
            if (!this.levels.length || !this.packs.length) return [];
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
        const [leaderboard, err] = await fetchLeaderboard();
        this.leaderboard = leaderboard;
        this.err = err;
        // Fetch packs and levels
        try {
            const packsRes = await fetch('/data/packs.json');
            this.packs = await packsRes.json();
        } catch {}
        try {
            const listRes = await fetch('/data/_list.json');
            const list = await listRes.json();
            this.levels = await Promise.all(list.map(async (path) => {
                const res = await fetch(`/data/${path}.json`);
                return await res.json();
            }));
        } catch {}
        // Hide loading spinner
        this.loading = false;
    },
    methods: {
        localize,
    },
};
