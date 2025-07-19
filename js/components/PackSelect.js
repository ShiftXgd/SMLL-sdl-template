export default {
    props: {
        modelValue: String,
        options: Array,
    },
    data() {
        return {
            open: false,
            hoveredIndex: null,
        };
    },
    methods: {
        select(option) {
            this.$emit('update:modelValue', option.id);
            this.open = false;
        },
        toggle() {
            this.open = !this.open;
        },
        close() {
            this.open = false;
        },
        handleClickOutside(e) {
            if (!this.$el.contains(e.target)) {
                this.open = false;
            }
        },
        onHover(index) {
            this.hoveredIndex = index;
        },
        onLeave() {
            this.hoveredIndex = null;
        }
    },
    mounted() {
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    template: `
        <div class="custom-select" :class="{ open }" @keydown.esc="close">
            <div class="custom-select__selected" @click="toggle">
                <span>{{ options.find(o => o.id === modelValue)?.name || 'Select Pack' }}</span>
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>
            </div>
            <ul v-if="open" class="custom-select__dropdown">
                <li v-for="(option, i) in options"
                    :key="option.id"
                    @click="select(option)"
                    @mouseenter="onHover(i)"
                    @mouseleave="onLeave"
                    :class="{ selected: option.id === modelValue || hoveredIndex === i }"
                    :style="hoveredIndex === i ? { background: option.color || 'var(--color-primary)', color: 'white' } : {}"
                >
                    {{ option.name }}
                </li>
            </ul>
        </div>
    `
}; 