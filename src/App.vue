<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { parseMarkdown, renderTokens } from '../lib';

const STORAGE_KEY = 'mini-markdown-editor-draft';
const initialMarkdown = '# MiniMarkDownEditor\n\n开始编辑 Markdown，右侧会实时显示预览。\n\n- 支持 **粗体**、*斜体* 和 [链接](https://example.com)\n- 支持行内代码：`const ready = true`\n';

const markdown = ref(initialMarkdown);
const copied = ref(false);
const errorMessage = ref('');

const previewHtml = computed(() => {
  try {
    errorMessage.value = '';
    return renderTokens(parseMarkdown(markdown.value));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '预览生成失败';
    return '';
  }
});

const characterCount = computed(() => markdown.value.length);

onMounted(() => {
  const savedDraft = window.localStorage.getItem(STORAGE_KEY);
  if (savedDraft !== null) {
    markdown.value = savedDraft;
  }
});

watch(markdown, (value) => {
  window.localStorage.setItem(STORAGE_KEY, value);
  copied.value = false;
});

function clearDraft(): void {
  markdown.value = '';
}

async function copyMarkdown(): Promise<void> {
  try {
    await navigator.clipboard.writeText(markdown.value);
    copied.value = true;
  } catch {
    errorMessage.value = '复制失败，请检查浏览器权限';
  }
}

function exportMarkdown(): void {
  const blob = new Blob([markdown.value], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'markdown-document.md';
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <main class="editor-shell">
    <header class="app-header">
      <div class="brand-block">
        <span class="brand-mark" aria-hidden="true">M</span>
        <div>
          <h1>MiniMarkDownEditor</h1>
          <p>专注写作，实时预览</p>
        </div>
      </div>
      <div class="toolbar" aria-label="文档操作">
        <span class="character-count">{{ characterCount }} 字</span>
        <button type="button" class="toolbar-button" @click="clearDraft">清空</button>
        <button type="button" class="toolbar-button" @click="copyMarkdown">
          {{ copied ? '已复制' : '复制' }}
        </button>
        <button type="button" class="toolbar-button toolbar-button-primary" @click="exportMarkdown">导出</button>
      </div>
    </header>

    <section class="workspace" aria-label="Markdown 编辑器">
      <section class="editor-panel" aria-labelledby="editor-title">
        <div class="panel-heading">
          <h2 id="editor-title">Markdown</h2>
          <span class="panel-badge">编辑</span>
        </div>
        <textarea v-model="markdown" class="markdown-input" aria-label="Markdown 输入区" spellcheck="false" placeholder="输入 Markdown..." />
      </section>

      <section class="preview-panel" aria-labelledby="preview-title">
        <div class="panel-heading">
          <h2 id="preview-title">预览</h2>
          <span class="panel-badge panel-badge-live">实时</span>
        </div>
        <article v-if="!errorMessage" class="preview-content" v-html="previewHtml" />
        <p v-else class="preview-error" role="alert">{{ errorMessage }}</p>
      </section>
    </section>
  </main>
</template>
