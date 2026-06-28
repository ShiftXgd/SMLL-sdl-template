import { getCountryCode, getFlagUrl } from '../playerFlags.js';

export default {
    props: {
        name: {
            type: String,
            required: true,
        },
        size: {
            type: String,
            default: 'md',
            validator: (value) => ['sm', 'md', 'lg'].includes(value),
        },
    },
    computed: {
        flagUrl() {
            return getFlagUrl(this.name);
        },
        countryCode() {
            return getCountryCode(this.name);
        },
        sizeClass() {
            return this.size !== 'md' ? `player-name--${this.size}` : '';
        },
    },
    template: `
        <span :class="['player-name', sizeClass]">
            <img
                v-if="flagUrl"
                class="player-flag"
                :src="flagUrl"
                :alt="countryCode + ' flag'"
            />
            <span>{{ name }}</span>
        </span>
    `,
};
