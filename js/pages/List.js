import { store } from "../main.js";
import { embed, getThumbnailFromUrl } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";
import { loadPlayerFlags } from "../playerFlags.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";
import PackSelect from '../components/PackSelect.js';
import PlayerName from "../components/PlayerName.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
    toni: "toni"
};

export default {
    components: { Spinner, LevelAuthors, PackSelect, PlayerName },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <teleport to="#pack-select-container">
                <PackSelect v-if="packs.length" v-model="selectedPack" :options="packs" />
            </teleport>

            <div class="mode-switcher-bar">
                <div class="mode-switcher__pill">
                    <button
                        class="mode-switcher__btn"
                        :class="{ active: store.listMode === 'classic' }"
                        @click="switchMode('classic')"
                    >
                        Classic
                    </button>
                    <button
                        class="mode-switcher__btn"
                        :class="{ active: store.listMode === 'platformer' }"
                        @click="switchMode('platformer')"
                    >
                        Platformer
                    </button>
                </div>
            </div>

            <div class="list-toolbar">
                <input
                    v-model="search"
                    class="list-search type-label-lg"
                    placeholder="Search levels..."
                    type="text"
                />
            </div>

            <div v-if="filteredList.length" class="level-feed">
                <template v-for="([level, err], i) in filteredList" :key="level?.path || err">
                    <div v-if="i === 29" class="level-divider type-label-lg">Extended</div>

                    <article
                        class="level-row"
                        :class="{
                            active: selectedPath === level?.path,
                            error: !level,
                        }"
                        @click="level && selectLevel(level.path)"
                    >
                        <div class="level-row__info">
                            <p class="level-row__rank type-label-lg">{{ rankLabel(i) }}</p>
                            <h2 class="level-row__name">
                                {{ level?.name || ('Error (' + err + '.json)') }}
                            </h2>
                            <p v-if="level" class="level-row__by type-body">
                                by <template v-for="(creator, ci) in creatorNames(level)" :key="creator + ci">
                                    <PlayerName :name="creator" /><span v-if="ci < creatorNames(level).length - 1">, </span>
                                </template>
                            </p>
                            <div v-if="level" class="level-row__meta type-label-md">
                                <span>ID {{ level.id }}</span>
                                <span>{{ formatDate(level.date) }}</span>
                            </div>
                        </div>
                        <div class="level-row__thumb">
                            <img
                                v-if="level && thumbnail(level)"
                                :src="thumbnail(level)"
                                :alt="level.name + ' thumbnail'"
                                loading="lazy"
                            />
                            <div v-else class="level-row__thumb-fallback type-label-lg">
                                No thumbnail
                            </div>
                        </div>
                    </article>

                    <section
                        v-if="level && selectedPath === level.path"
                        class="level-detail"
                    >
                        <div class="level-detail__split-container">
                            
                            <div class="level-detail__left-col">
                                <h1>{{ level.name }}</h1>
                                <LevelAuthors
                                    :author="level.author"
                                    :creators="level.creators"
                                    :verifier="level.verifier"
                                />
                                <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                                <ul class="stats">
                                    <li>
                                        <div class="type-title-sm">Points when completed</div>
                                        <p>{{ score(globalRank(level.path), 100, level.percentToQualify) }}</p>
                                    </li>
                                    <li>
                                        <div class="type-title-sm">ID</div>
                                        <p>{{ level.id }}</p>
                                    </li>
                                    <li>
                                        <div class="type-title-sm">Password</div>
                                        <p>{{ level.password || 'Free to Copy' }}</p>
                                    </li>
                                </ul>
                            </div>

                            <div class="level-detail__right-col">
                                <h2 class="idfkwhattonamethis">Records</h2>
                                <p v-if="globalRank(level.path) <= 75">
                                    <strong>{{ level.percentToQualify }}%</strong> or better to qualify
                                </p>
                                <p v-else-if="globalRank(level.path) <= 150">
                                    <strong>100%</strong> or better to qualify
                                </p>
                                <p v-else>This level does not accept new records.</p>
                                
                                <table class="records">
                                    <tr v-for="record in level.records" class="record">
                                        <td class="percent">
                                            <p>{{ record.percent }}%</p>
                                        </td>
                                        <td class="user">
                                            <a :href="record.link" target="_blank" class="type-label-lg">
                                                <PlayerName :name="record.user" />
                                            </a>
                                        </td>
                                        <td class="mobile">
                                            <img
                                                v-if="record.mobile"
                                                :src="'/assets/phone-landscape' + (store.dark ? '-dark' : '') + '.svg'"
                                                alt="Mobile"
                                            />
                                        </td>
                                        <td class="hz">
                                            <p>{{ record.hz }}Hz</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                        </div>
                    </section>
                </template>
            </div>

            <div v-else class="level-feed-empty">
                <p>No levels found bruh (ノಠ益ಠ)ノ彡┻━┻</p>
            </div>

            <footer class="list-footer">
                <div class="errors" v-show="errors.length > 0">
                    <p class="error" v-for="error of errors">{{ error }}</p>
                </div>
                <div class="og">
                    <p class="type-label-md">
                        Website layout made by
                        <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a>
                    </p>
                </div>
                <template v-if="editors">
                    <h3>List Editors</h3>
                    <ol class="editors">
                        <li v-for="editor in editors">
                            <img
                                :src="'/assets/' + roleIconMap[editor.role] + (store.dark ? '-dark' : '') + '.svg'"
                                :alt="editor.role"
                            />
                            <a
                                v-if="editor.link && editor.role !== 'toni'"
                                class="type-label-lg link"
                                :class="{ 'toni-font': editor.role === 'toni' }"
                                target="_blank"
                                :href="editor.link"
                            >
                                <PlayerName :name="editor.name" />
                            </a>
                            <a
                                v-else-if="editor.link && editor.role === 'toni'"
                                class="type-label-lg link toni-font toni-typewriter"
                                target="_blank"
                                :href="editor.link"
                            >{{ toniDisplayText }}<span class="toni-cursor">|</span></a>
                            <p v-else :class="{ 'toni-font': editor.role === 'toni' }">
                                <PlayerName :name="editor.name" />
                            </p>
                        </li>
                    </ol>
                </template>
                <h3>Submission Requirements</h3>
                <p>Achieved the record without using hacks (however, FPS bypass is allowed, up to 360fps)</p>
                <p>Achieved the record on the level that is listed on the site - please check the level ID before you submit a record</p>
                <p>Have either source audio or clicks/taps in the video. Edited audio only does not count</p>
                <p>The recording must have a previous attempt and entire death animation shown before the completion, unless the completion is on the first attempt. Everyplay records are exempt from this</p>
                <p>The recording must also show the player hit the endwall, or the completion will be invalidated.</p>
                <p>Do not use secret routes or bug routes</p>
                <p>Do not use easy modes, only a record of the unmodified level qualifies</p>
                <p>Once a level falls onto the Legacy List, we accept records for it for 24 hours after it falls off, then afterwards we never accept records for said level</p>
            </footer>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selectedPath: null,
        errors: [],
        roleIconMap,
        store,
        search: '',
        packs: [],
        selectedPack: null,
        toniDisplayText: '',
        toniFullText: 'TonyMakaroni (website layout scripter)',
        toniInterval: null,
    }),
    computed: {
        filteredList() {
            let filtered = this.list;
            if (this.selectedPack === 'all') {
                filtered = this.list;
            } else if (this.selectedPack === 'top5') {
                filtered = this.list.slice(0, 5);
            } else if (this.selectedPack === 'top10') {
                filtered = this.list.slice(0, 10);
            } else if (this.selectedPack) {
                filtered = filtered.filter(([level]) => level && Array.isArray(level.inwhatpack) && level.inwhatpack.includes(this.selectedPack));
            }
            if (this.search) {
                const q = this.search.toLowerCase();
                filtered = filtered.filter(([level]) => level && level.name.toLowerCase().includes(q));
            }
            return filtered;
        },
        selectedEntry() {
            return this.filteredList.find(([level]) => level?.path === this.selectedPath);
        },
        video() {
            const level = this.selectedEntry?.[0];
            if (!level) return '';
            if (!level.showcase) return embed(level.verification);
            return embed(this.toggledShowcase ? level.showcase : level.verification);
        },
    },
    async mounted() {
        await this.loadList();
        this.startToniAnimation();
    },
    methods: {
        embed,
        score,
        async loadList() {
            this.loading = true;
            this.selectedPath = null;
            this.errors = [];

            [this.list, this.editors] = await Promise.all([
                fetchList(store.listMode),
                fetchEditors(),
                loadPlayerFlags(),
            ]);

            try {
                const packsRes = await fetch('/data/packs.json');
                this.packs = await packsRes.json();
                if (this.packs.length > 0) {
                    this.selectedPack = this.packs[0].id;
                }
            } catch {
                this.packs = [];
            }

            if (!this.list) {
                this.errors = [
                    "Failed to load list. Retry in a few minutes or notify list staff.",
                ];
            } else {
                this.errors.push(
                    ...this.list
                        .filter(([_, err]) => err)
                        .map(([_, err]) => `Failed to load level. (${err}.json)`)
                );
                if (!this.editors) {
                    this.errors.push("Failed to load list editors.");
                }
            }

            this.loading = false;
        },
        async switchMode(mode) {
            if (store.listMode === mode) return;
            store.setListMode(mode);
            await this.loadList();
        },
        selectLevel(path) {
            this.selectedPath = this.selectedPath === path ? null : path;
        },
        rankLabel(index) {
            const path = this.filteredList[index]?.[0]?.path;
            const rank = path ? this.globalRank(path) : index + 1;
            return rank <= 150 ? `#${rank}` : 'Legacy';
        },
        globalRank(path) {
            const idx = this.list.findIndex(([level]) => level?.path === path);
            return idx >= 0 ? idx + 1 : 0;
        },
        creatorNames(level) {
            if (level.creators?.length) return level.creators;
            return [level.author];
        },
        thumbnail(level) {
            return getThumbnailFromUrl(level.showcase || level.verification);
        },
        formatDate(date) {
            if (!date) return '';
            const parsed = new Date(date);
            if (Number.isNaN(parsed.getTime())) return date;
            return parsed.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        },
        startToniAnimation() {
            const full = this.toniFullText;
            let i = 0;
            let typing = true;

            const tick = () => {
                if (typing) {
                    i++;
                    this.toniDisplayText = full.slice(0, i);
                    if (i >= full.length) {
                        typing = false;
                        setTimeout(() => { this.toniInterval = setInterval(tick, 50); }, 4000);
                        clearInterval(this.toniInterval);
                        return;
                    }
                } else {
                    i--;
                    this.toniDisplayText = full.slice(0, i);
                    if (i <= 0) {
                        typing = true;
                        setTimeout(() => { this.toniInterval = setInterval(tick, 80); }, 500);
                        clearInterval(this.toniInterval);
                        return;
                    }
                }
            };

            this.toniInterval = setInterval(tick, 80);
        },
    },
};