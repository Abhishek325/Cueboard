<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import AppIcon from './AppIcon.vue';
import { dayKey, groupVideos, monthCells } from '../lib/calendar.js';
const props = defineProps({ cache: Object, busy: Boolean });
defineEmits(['refresh', 'setup']);
const hasData = computed(() => props.cache != null);
const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const today = ref(dayKey(new Date(), zone)), offset = ref(0), selected = ref(''), position = ref({});
const month = computed(() => new Date(Date.UTC(Number(today.value.slice(0, 4)), Number(today.value.slice(5, 7)) - 1 + offset.value, 1)));
const label = computed(() => new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(month.value));
const groups = computed(() => groupVideos(props.cache?.videos || [], zone));
const cells = computed(() => monthCells(month.value.getUTCFullYear(), month.value.getUTCMonth()));
const videos = computed(() => groups.value[selected.value] || []);
let timer, hideTimer;
function reset() { today.value = dayKey(new Date(), zone); offset.value = 0; selected.value = ''; }
function show(event, key) { if (!hasData.value) return; clearTimeout(hideTimer); selected.value = key; const r = event.currentTarget.getBoundingClientRect(); position.value = { left: Math.max(10, Math.min(r.left, window.innerWidth - 330)) + 'px', top: (r.bottom + 8) + 'px' }; }
function hideSoon(event) { if (event.currentTarget.contains(event.relatedTarget)) return; hideTimer = setTimeout(() => { selected.value = ''; }, 180); }
function time(v) { return new Intl.DateTimeFormat(undefined, { timeZone: zone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v.calendarAt)); }
function thumbnail(v) { try { const url = new URL(v.thumbnail); return url.protocol === 'https:' && url.hostname === 'i.ytimg.com' ? url.href : ''; } catch { return ''; } }
function counts(key) { const entries = groups.value[key] || []; return { posted: entries.some(v => v.calendarStatus === 'posted'), scheduled: entries.some(v => v.calendarStatus === 'scheduled') }; }
function dayLabel(key) { return key + ', ' + (groups.value[key] || []).map(v => v.calendarStatus + ': ' + v.title).join(', '); }
watch(hasData, available => { if (!available) reset(); });
function closeOutside(event) { if (!event.target.closest('.posting-calendar, .calendar-popover')) selected.value = ''; }
onMounted(() => { timer = setInterval(() => { today.value = dayKey(new Date(), zone); }, 60000); document.addEventListener('click', closeOutside); });
onUnmounted(() => { clearInterval(timer); clearTimeout(hideTimer); document.removeEventListener('click', closeOutside); });
</script>
<template>
  <section class="posting-calendar" :class="{ 'has-no-data': !hasData }" aria-label="Monthly YouTube posting calendar">
    <div class="calendar-heading">
      <span>YouTube post calendar</span>
      <div class="calendar-actions">
        <button v-if="hasData" type="button" class="calendar-refresh" :disabled="busy" aria-label="Refresh posting calendar from YouTube" @click="$emit('refresh')"><AppIcon name="refresh" /></button>
        <button type="button" class="calendar-setup" aria-label="YouTube setup" @click="$emit('setup')">{{ hasData ? 'Settings' : 'Setup' }}</button>
      </div>
    </div>
    <div class="calendar-body" :aria-disabled="!hasData">
      <div class="calendar-nav">
        <button :disabled="!hasData" aria-label="Previous month" @click="offset--; selected = ''">‹</button>
        <button :disabled="!hasData" class="calendar-month" :aria-label="label + '. Return to this month.'" @click="reset">{{ label }}</button>
        <button :disabled="!hasData" aria-label="Next month" @click="offset++; selected = ''">›</button>
      </div>
      <div class="calendar-weekdays" aria-hidden="true"><span v-for="d in ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']" :key="d">{{ d }}</span></div>
      <div class="calendar-days" :aria-label="label + ', Monday to Sunday'">
        <template v-for="(key, n) in cells" :key="key || 'empty-' + n">
          <span v-if="!key" class="calendar-empty"></span>
          <component :is="hasData && groups[key]?.length ? 'button' : 'span'" v-else class="calendar-day" :class="{ 'has-post': counts(key).posted, 'has-scheduled': counts(key).scheduled, 'is-today': key === today, 'is-future': key > today }" :aria-label="dayLabel(key)" :aria-current="key === today ? 'date' : undefined" @pointerenter="hasData && groups[key]?.length && show($event, key)" @pointerleave="hideSoon" @focus="hasData && groups[key]?.length && show($event, key)" @focusout="hideSoon" @click="hasData && groups[key]?.length && show($event, key)">
            <span class="calendar-date">{{ Number(key.slice(8)) }}</span>
            <span class="calendar-day-icons"><svg v-if="counts(key).posted" aria-hidden="true" viewBox="0 0 12 12"><path d="m3 6 2 2 4-4" /></svg><svg v-if="counts(key).scheduled" class="calendar-clock" aria-hidden="true" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.25" /><path d="M6 3.5v2.7l1.7 1" /></svg></span>
          </component>
        </template>
      </div>
      <div class="calendar-legend"><span>✓ Posted</span><span>◷ Scheduled</span></div>
    </div>
  </section>
    <Teleport to="body"><div v-if="selected && videos.length" class="calendar-popover" :style="position" role="dialog" aria-label="YouTube videos on this day" @pointerenter="clearTimeout(hideTimer)" @pointerleave="hideSoon" @focusout="hideSoon" @keydown.esc="selected = ''"><div class="calendar-popover-heading">{{ selected }}<button aria-label="Close video preview" @click="selected = ''">×</button></div><a v-for="v in videos" :key="v.id" class="calendar-video" :href="v.calendarStatus === 'scheduled' ? 'https://studio.youtube.com/video/' + v.id + '/edit' : 'https://www.youtube.com/watch?v=' + v.id" target="_blank" rel="noopener noreferrer"><img v-if="thumbnail(v)" :src="thumbnail(v)" alt="" referrerpolicy="no-referrer"><span>{{ v.title }}<small>{{ v.calendarStatus === 'scheduled' ? 'Scheduled · ' + time(v) : 'Watch on YouTube ↗' }}</small></span></a><p class="calendar-popover-note">Dates in {{ zone }}. Schedules reflect the last sync; refresh to confirm changes.</p></div></Teleport>
</template>
