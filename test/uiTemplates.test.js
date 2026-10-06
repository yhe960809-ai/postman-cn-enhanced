import test from 'node:test';
import assert from 'node:assert/strict';
import { createTemplateTranslator } from '../src/uiTemplates.js';

test('translates rendered UI templates and preserves dynamic values', () => {
  const translate = createTemplateTranslator([
    ['No files matching "{searchQuery}"', '没有匹配“{searchQuery}”的文件'],
    ['Branch changed to "{branch}"', '已切换到分支“{branch}”'],
    ['{count} of {total} selected', '已选择 {count} 项，共 {total} 项']
  ]);
  assert.equal(translate('No files matching "api.env"'), '没有匹配“api.env”的文件');
  assert.equal(translate('Branch changed to "feature/$fix"'), '已切换到分支“feature/$fix”');
  assert.equal(translate('3 of 12 selected'), '已选择 3 项，共 12 项');
  assert.equal(translate('api_key=abc'), 'api_key=abc');
  assert.equal(translate('Prefix No files matching "api.env"'), 'Prefix No files matching "api.env"');
});

test('rejects unsafe templates and mismatched placeholders', () => {
  const translate = createTemplateTranslator([
    ['{name}', '名称：{name}'],
    ['Error: {error}', '错误：{other}'],
    ['Deleted {name} and {name}', '已删除 {name}']
  ]);
  assert.equal(translate('Dockerfile'), 'Dockerfile');
  assert.equal(translate('Error: failed'), 'Error: failed');
  assert.equal(translate('Deleted A and B'), 'Deleted A and B');
  assert.equal(translate('Deleted A and A'), '已删除 A');
});
