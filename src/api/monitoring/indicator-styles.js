import { ensureTooltips } from './tooltip-helper.js'; // Импортируем функцию из нового файла

/**
 * Функция добавления стилей для индикаторов
 * Теперь также проверяет и добавляет всплывающие подсказки, если их нет
 */
export function addIndicatorStyles() {
  // Стили теперь определены в css/modules/api-sources.css,
  // но мы все равно проверяем и добавляем всплывающие подсказки
  ensureTooltips();
}