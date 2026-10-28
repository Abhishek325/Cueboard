<script setup>
import { computed, ref, watch } from 'vue';
import { channelImageUrl } from '../lib/channel-branding.js';
import '../styles/channel-artwork.css';
const props = defineProps({ cache: Object, kind: { type: String, default: 'banner' } });
const failed = ref(false);
const url = computed(() => channelImageUrl(props.kind === 'avatar' ? props.cache?.channelLogoUrl : props.cache?.channelBannerUrl));
watch([url, () => props.cache?.channelId, () => props.cache?.fetchedAt], () => { failed.value = false; });
const description = computed(() => `${props.cache?.channelTitle || 'YouTube channel'} ${props.kind === 'avatar' ? 'logo' : 'banner'}`);
</script>
<template>
  <div v-if="url && !failed" :class="kind === 'avatar' ? 'channel-avatar' : 'channel-banner'">
    <img :src="url" :alt="description" decoding="async" referrerpolicy="no-referrer" @error="failed = true">
  </div>
</template>
