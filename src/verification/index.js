/**
 * Модуль для работы с вкладкой "Проверка"
 * @module verification
 */

import { getCurrentTask } from '../app.js';
import { showNotification } from '../ui/notifications.js';
import { createDynamicModal } from '../ui/index.js';
import { emit, on } from '../core/events.js';
import { getAnswerFromChatGpt } from '../ai/chatgpt-api.js';
import aiAssistant from '../ai/assistant.js';
import { getUserProgress, markTaskAsCompleted } from '../data/user-progress.js';

// Состояние модуля
let currentTask = null;
let currentMode = 'multiple-choice'; // 'multiple-choice' или 'free-form'
let verificationInProgress = false;
let correctAnswers = null; // Будет заполнено из данных задания

/**
 * Инициализация вкладки "Проверка"
 */
export function initVerificationTab() {
  try {
    // Проверяем, что DOM загружен и элементы существуют
    const multipleChoiceContainer = document.getElementById('multiple-choice-questions');
    const freeFormContainer = document.getElementById('free-form-questions');
    
    if (!multipleChoiceContainer || !freeFormContainer) {
      console.warn('Элементы для вкладки "Проверка" еще не загружены');
      return false; // Возвращаем false, чтобы показать, что инициализация не выполнена
    }

    // Получаем текущее задание
    currentTask = getCurrentTask();
    
    if (!currentTask) {
      console.warn('Текущее задание не найдено для вкладки "Проверка"');
      return false;
    }
    
    // Диагностическое логирование
    console.log('Текущее задание для верификации:', currentTask);
    console.log('Параметры верификации:', {
      verificationType: currentTask.verificationType,
      verificationQuestion: currentTask.verificationQuestion,
      verificationOptions: currentTask.verificationOptions,
      verification_answers: currentTask.verification_answers
    });
    
    // Инициализируем корректные ответы из данных задания
    initCorrectAnswers();
    generateQuestions();
    
    // Определяем режим ответа на основе флага в задании
    if (currentTask && currentTask.verificationType) {
        currentMode = currentTask.verificationType;
    } else {
        // По умолчанию используем режим с вариантами ответов
        currentMode = 'multiple-choice';
    }
    
    // Отображаем соответствующий блок вопросов, но не меняем видимость вкладки
    // Это важно, чтобы не активировать вкладку "Проверка" при загрузке
    multipleChoiceContainer.style.display = currentMode === 'multiple-choice' ? 'block' : 'none';
    freeFormContainer.style.display = currentMode === 'free-form' ? 'block' : 'none';
    
    // Инициализируем кнопку проверки ответа, если она существует
    const checkButton = document.getElementById('check-solution');
    if (checkButton) {
      console.log('Кнопка проверки ответа найдена и инициализирована');
    }
    
    // Подписываемся на события изменения рабочей области, только если еще не подписаны
    const alreadySubscribed = on('workspaceSetup', (task) => {
        currentTask = task;
        resetVerification();
        initCorrectAnswers();
        generateQuestions();
        
        // Обновляем режим при смене задания
        if (task && task.verificationType) {
            currentMode = task.verificationType;
        } else {
            currentMode = 'multiple-choice';
        }
        
        // Отображаем соответствующий блок вопросов (без переключения на вкладку "Проверка")
        if (document.getElementById('multiple-choice-questions') && document.getElementById('free-form-questions')) {
            document.getElementById('multiple-choice-questions').style.display = currentMode === 'multiple-choice' ? 'block' : 'none';
            document.getElementById('free-form-questions').style.display = currentMode === 'free-form' ? 'block' : 'none';
            
            console.log('Подготовлены блоки вопросов для вкладки "Проверка" без активации вкладки');
        }
    });
    
    console.log('Вкладка "Проверка" успешно инициализирована');
    return true; // Возвращаем true, чтобы показать успешную инициализацию
  } catch (error) {
    console.error('Ошибка при инициализации вкладки "Проверка":', error);
    return false;
  }
}

/**
 * Инициализация правильных ответов из данных задания
 */
function initCorrectAnswers() {
    if (!currentTask) return;
    
    // Берем данные только из задания в БД
    
    // Если в задании указаны verification_answers, используем их
    if (currentTask.verification_answers) {
        correctAnswers = currentTask.verification_answers;
        console.log('Правильные ответы загружены из задания:', correctAnswers);
    } else {
        // Базовые значения по умолчанию, если данных нет
        correctAnswers = {
            beginnerAnswers: ['correct'],
            advancedAnswerKeywords: ['корректно', 'правильно', 'верно']
        };
        console.log('Внимание: в задании отсутствуют данные о правильных ответах, используем значения по умолчанию');
    }
}

/**
 * Генерирует HTML с вопросами и вариантами ответов
 */
function generateQuestions() {
  if (!currentTask) return;
  
  // Контейнер для вопросов с вариантами ответов
  const multipleChoiceQuestionsContainer = document.getElementById('multiple-choice-questions');
  if (multipleChoiceQuestionsContainer && currentTask.verificationQuestion) {
      // Очищаем контейнер
      multipleChoiceQuestionsContainer.innerHTML = '';
      
      // Создаем заголовок вопроса (используем вопрос из задания или стандартный)
      const questionTitle = document.createElement('div');
      questionTitle.className = 'question-title';
      const questionText = currentTask.verificationQuestion || 'Проверьте правильность выполнения задания';
      questionTitle.innerHTML = `<h4>${questionText}</h4>`;
      multipleChoiceQuestionsContainer.appendChild(questionTitle);
      
      // Создаем варианты ответов
      const answerOptions = document.createElement('div');
      answerOptions.className = 'answer-options';
      
      // Если в задании нет вариантов ответов, добавляем базовые заглушки
      const defaultChoices = [
          { value: 'correct', label: 'Запрос выполнен корректно' },
          { value: 'incorrect_url', label: 'Неверный URL запроса' },
          { value: 'incorrect_method', label: 'Неверный метод запроса' }
      ];
      
      // Используем только варианты ответов из БД, если их нет - показываем базовые
      console.log('Варианты ответов из задания:', currentTask.verificationOptions);
      const taskAnswers = currentTask.verificationOptions || defaultChoices;
      console.log('Фактически используемые варианты ответов:', taskAnswers);
      
      // Генерируем HTML для каждого варианта ответа
      taskAnswers.forEach((answer, index) => {
          const optionDiv = document.createElement('div');
          optionDiv.className = 'answer-option';
          
          optionDiv.innerHTML = `
              <input type="checkbox" id="answer-${index + 1}" name="answer" value="${answer.value}">
              <label for="answer-${index + 1}">${answer.label}</label>
          `;
          
          answerOptions.appendChild(optionDiv);
      });
      
      multipleChoiceQuestionsContainer.appendChild(answerOptions);
  }
  
  // Контейнер для свободного ответа
  const freeFormQuestionsContainer = document.getElementById('free-form-questions');
  if (freeFormQuestionsContainer) {
      // Очищаем контейнер
      freeFormQuestionsContainer.innerHTML = '';
      
      // Создаем заголовок вопроса (используем вопрос из задания или стандартный)
      const questionTitle = document.createElement('div');
      questionTitle.className = 'question-title';
      const questionText = currentTask.verificationQuestion || 'Проверьте правильность выполнения задания';
      questionTitle.innerHTML = `<h4>${questionText}</h4>`;
      freeFormQuestionsContainer.appendChild(questionTitle);
      
      // Создаем поле для свободного ответа
      const freeFormAnswer = document.createElement('div');
      freeFormAnswer.className = 'free-form-answer';
      freeFormAnswer.innerHTML = `
          <textarea id="free-answer" class="form-control" rows="6" placeholder="Введите ваш ответ..."></textarea>
      `;
      
      freeFormQuestionsContainer.appendChild(freeFormAnswer);
  }
}

/**
 * Проверка ответа пользователя
 * @export
 */
export async function checkAnswer() {
    // Проверяем, не выполняется ли уже проверка
    if (verificationInProgress) {
        showNotification('Проверка уже выполняется. Пожалуйста, подождите.', 'info');
        return;
    }
    
    // Получаем ответы пользователя в зависимости от режима
    let userAnswers = [];
    let userAnswer = '';
    
    if (currentMode === 'multiple-choice') {
        // Собираем ответы из чекбоксов
        document.querySelectorAll('input[name="answer"]:checked').forEach(input => {
            userAnswers.push(input.value);
        });
        
        if (userAnswers.length === 0) {
            showNotification('Пожалуйста, выберите хотя бы один вариант ответа', 'warning');
            return;
        }
    } else {
        // Получаем текст из textarea
        userAnswer = document.getElementById('free-answer')?.value.trim();
        
        if (!userAnswer) {
            showNotification('Пожалуйста, введите ваш ответ', 'warning');
            return;
        }
    }
    
    // Устанавливаем флаг выполнения проверки
    verificationInProgress = true;
    
    // Показываем индикатор загрузки
    const resultsBlock = document.getElementById('verification-results');
    if (resultsBlock) {
        resultsBlock.style.display = 'block';
        resultsBlock.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>Проверка ответа...</p>
            </div>
        `;
    }
    
    try {
        // Проверяем ответы и получаем результат
        let result;
        let feedback;
        
        if (currentMode === 'multiple-choice') {
            result = checkMultipleChoiceAnswers(userAnswers);
            feedback = await generateAiFeedbackForMultipleChoice(userAnswers, result);
        } else {
            result = await checkAdvancedAnswer(userAnswer);
            feedback = result.feedback;
        }
        
        // Отображаем результаты
        showResults(result, feedback);
        
        // Обновляем прогресс задания, если ответ верный
        if (result.success) {
            updateTaskProgress();
        }
        
        // Генерируем событие завершения проверки
        emit('verificationCompleted', { 
            mode: currentMode, 
            success: result.success,
            result: result
        });
        
    } catch (error) {
        console.error('Ошибка при проверке ответа:', error);
        
        // Показываем уведомление об ошибке
        showNotification('Произошла ошибка при проверке ответа: ' + error.message, 'error');
        
        // Скрываем блок результатов
        if (resultsBlock) {
            resultsBlock.style.display = 'none';
        }
        
        // Генерируем событие ошибки
        emit('verificationError', { mode: currentMode, error });
    } finally {
        // Сбрасываем флаг выполнения проверки
        verificationInProgress = false;
    }
}

/**
 * Проверка ответов начального уровня (с вариантами)
 * @param {string[]} userAnswers - Массив выбранных пользователем ответов
 * @returns {Object} Результат проверки
 */
function checkMultipleChoiceAnswers(userAnswers) {
    // Проверяем, что в correctAnswers есть beginnerAnswers
    if (!correctAnswers || !correctAnswers.beginnerAnswers) {
        return {
            success: false,
            message: 'Не удалось определить правильные ответы для проверки',
            details: {
                correctAnswers: [],
                userAnswers,
                correctCount: 0,
                incorrectCount: userAnswers.length,
                missedCount: 0
            }
        };
    }
    
    const correctAnswerSet = new Set(correctAnswers.beginnerAnswers);
    const userAnswerSet = new Set(userAnswers);
    
    // Подсчитываем правильные, неправильные и пропущенные ответы
    let correctCount = 0;
    let incorrectCount = 0;
    
    // Проверяем выбранные пользователем ответы
    for (const answer of userAnswers) {
        if (correctAnswerSet.has(answer)) {
            correctCount++;
        } else {
            incorrectCount++;
        }
    }
    
    // Считаем, сколько правильных ответов пользователь не выбрал
    const missedCount = correctAnswers.beginnerAnswers.length - correctCount;
    
    // Определяем успешность проверки
    const totalCorrectAnswers = correctAnswers.beginnerAnswers.length;
    const success = correctCount === totalCorrectAnswers && incorrectCount === 0;
    const partial = correctCount > 0 && (incorrectCount > 0 || missedCount > 0);

    // Дополнительная проверка, гарантирующая, что неверный выбор не считается успешным
    if (incorrectCount > 0) {
        // Если есть хоть один неверный ответ, это не может быть полным успехом
        return {
            success: false,
            partial: correctCount > 0, // Частичный успех только если есть правильные ответы
            message: correctCount > 0 ? 'Частично верно. Но некоторые выбранные ответы неверны.' : 'Неверный ответ.',
            details: {
                correctAnswers: correctAnswers.beginnerAnswers,
                userAnswers,
                correctCount,
                incorrectCount,
                missedCount
            }
        };
    }
    
    // Определяем сообщение результата
    let message;
    if (success) {
        message = 'Отлично! Все ответы верны.';
    } else if (partial) {
        message = 'Частично верно. Есть правильные ответы, но есть ошибки или пропуски.';
    } else {
        message = 'Неверный ответ. Попробуйте еще раз.';
    }
    
    return {
        success,
        partial,
        message,
        details: {
            correctAnswers: correctAnswers.beginnerAnswers,
            userAnswers,
            correctCount,
            incorrectCount,
            missedCount
        }
    };
}

/**
 * Проверка ответа продвинутого уровня (свободный ответ)
 * @param {string} userAnswer - Текст ответа пользователя
 * @returns {Object} Результат проверки и отзыв ИИ
 */
async function checkAdvancedAnswer(userAnswer) {
    // Если есть доступ к API ChatGPT, используем его для проверки
    try {
        // Получаем актуальные данные из задания
        const taskDescription = currentTask.description || "Анализ ответа API";
        const taskQuestion = currentTask.verificationQuestion || "Опишите проблемы в ответе API";
        
        // Получаем актуальный ответ API из разных возможных источников
        let apiResponse = "";
        
        // 1. Проверяем, есть ли apiResponse в задании
        if (currentTask.apiResponse) {
            apiResponse = typeof currentTask.apiResponse === 'object' 
                ? JSON.stringify(currentTask.apiResponse, null, 2)
                : currentTask.apiResponse;
        } 
        // 2. Пробуем получить из ответа последнего запроса
        else {
            try {
                // Получаем последний ответ из DOM - текста pre с ответом
                const responseBodyElement = document.getElementById('response-body');
                if (responseBodyElement && responseBodyElement.textContent) {
                    const responseText = responseBodyElement.textContent.trim();
                    if (responseText && responseText !== '[Нет содержимого]') {
                        try {
                            // Пробуем распарсить JSON
                            const responseObj = JSON.parse(responseText);
                            apiResponse = JSON.stringify(responseObj, null, 2);
                        } catch {
                            // Если не удалось распарсить, используем как текст
                            apiResponse = responseText;
                        }
                    }
                }
            } catch (e) {
                console.warn("Не удалось получить последний ответ API из DOM:", e);
            }
        }
        
        // 3. Если ничего не удалось получить, ищем ответ в apiResponses
        if (!apiResponse && currentTask.solution && currentTask.solution.url) {
            const method = currentTask.solution.method || "GET";
            const url = currentTask.solution.url;
            const key = `${method}:${url}`;
            
            try {
                // Импортируем apiResponses (предполагается, что он доступен)
                const { apiResponses } = await import('../data/responses.js');
                if (apiResponses[key] && apiResponses[key].body) {
                    apiResponse = typeof apiResponses[key].body === 'object'
                        ? JSON.stringify(apiResponses[key].body, null, 2)
                        : apiResponses[key].body;
                }
            } catch (e) {
                console.warn("Не удалось получить ответ из apiResponses:", e);
            }
        }
        
        // 4. Если ничего не удалось получить, используем пример из первого задания
        if (!apiResponse) {
            apiResponse = `{
    "id": 1,
    "name": "Иван Петров",
    "email": "ivan@example.com",
    "role": "admin",
    "createdAt": "2024-03-15T10:30:00.000Z"
}`;
        }
        
        // Получаем требования из задания
        const requirements = currentTask.requirements 
            ? currentTask.requirements.join('\n') 
            : "Требования не указаны";
            
        // Получаем ожидаемый результат из задания
        const expectedResult = currentTask.expectedResult || "Ожидаемый результат не указан";
        
        // Получаем ключевые слова для проверки
        const keywordsToCheck = correctAnswers.advancedAnswerKeywords || 
            ['пустые поля', 'значения не заполнены', 'createdAt', 'лишнее поле'];
        
        // Формируем запрос для ChatGPT с актуальными данными задания
        const prompt = `
        Проверь ответ студента на задание по API.
        
        Задание:
        ${taskDescription}
        
        Вопрос:
        ${taskQuestion}
        
        Требования:
        ${requirements}
        
        Ожидаемый результат:
        ${expectedResult}
        
        Пользователь получил ответ API: 
        ${apiResponse}
        
        Верный ответ должен содержать упоминание следующих моментов:
        ${keywordsToCheck.join(', ')}
        
        Ответ студента:
        "${userAnswer}"
        
        Пожалуйста, оцени ответ студента по шкале от 0 до 100%, определи есть ли в ответе упоминание основных моментов, которые должны быть в верном ответе.
        Дай развернутый комментарий, объясняющий оценку, но не говори прямо, что верным ответом является. Укажи, что студент понял правильно и что упустил.
        В конце сделай вывод - верный ответ (90-100%), частично верный (50-89%) или неверный (0-49%).
        Оформи ответ строго в формате JSON: {"score": число от 0 до 100, "feedback": "твой комментарий", "result": "верный" или "частично верный" или "неверный"}
        
        Примечание: Основывай свою проверку на конкретном задании и ответе API, который я предоставил выше.`;
        
        // Получаем ответ от ИИ
        const response = await getAnswerFromChatGpt(prompt, { task: currentTask });
        
        // Пытаемся извлечь JSON из ответа
        let aiResult;
        try {
            // Ищем JSON в ответе с помощью регулярного выражения
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiResult = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('JSON не найден в ответе ИИ');
            }
        } catch (e) {
            console.warn('Не удалось извлечь JSON из ответа ИИ:', e);
            
            // Если не удалось извлечь JSON, создаем объект на основе текста ответа
            aiResult = {
                score: response.includes('верный ответ') ? 90 : 
                       response.includes('частично верный') ? 70 : 30,
                feedback: response,
                result: response.includes('верный ответ') ? 'верный' : 
                       response.includes('частично верный') ? 'частично верный' : 'неверный'
            };
        }
        
        return {
            success: aiResult.result === 'верный',
            partial: aiResult.result === 'частично верный',
            message: `Оценка: ${aiResult.score}% - ${aiResult.result}`,
            feedback: aiResult.feedback,
            details: {
                score: aiResult.score,
                result: aiResult.result
            }
        };
        
    } catch (error) {
        console.error('Ошибка при обработке свободного ответа с помощью ИИ:', error);
        
        // Если не удалось использовать ИИ, выполняем базовую проверку по ключевым словам
        return performBasicKeywordCheck(userAnswer);
    }
}

/**
 * Базовая проверка ответа по ключевым словам (используется, если не удалось проверить через ИИ)
 * @param {string} userAnswer - Текст ответа пользователя
 * @returns {Object} Результат проверки
 */
function performBasicKeywordCheck(userAnswer) {
    const lowerAnswer = userAnswer.toLowerCase();
    let foundKeywords = 0;
    const keywords = correctAnswers.advancedAnswerKeywords || 
        ['корректно', 'правильно', 'верно'];
    
    // Подсчитываем количество найденных ключевых слов
    for (const keyword of keywords) {
        if (lowerAnswer.includes(keyword.toLowerCase())) {
            foundKeywords++;
        }
    }
    
    // Рассчитываем процент правильности
    const score = Math.round((foundKeywords / keywords.length) * 100);
    
    // Определяем результат
    let result, success, partial;
    if (score >= 90) {
        result = 'верный';
        success = true;
        partial = false;
    } else if (score >= 50) {
        result = 'частично верный';
        success = false;
        partial = true;
    } else {
        result = 'неверный';
        success = false;
        partial = false;
    }
    
    // Генерируем базовый отзыв
    const feedback = `
        <p>В вашем ответе найдено ${foundKeywords} из ${keywords.length} ключевых элементов.</p>
        <p>Оценка: ${score}%</p>
        <p>Результат: ${result}</p>
        <p>Обратите внимание на следующие аспекты при анализе ответа API:</p>
        <ul>
            ${keywords.map(kw => `<li>${kw}</li>`).join('')}
        </ul>
    `;
    
    return {
        success,
        partial,
        message: `Оценка: ${score}% - ${result}`,
        feedback,
        details: {
            foundKeywords,
            totalKeywords: keywords.length,
            score,
            result
        }
    };
}

/**
 * Генерация отзыва ИИ для ответов с вариантами
 * @param {string[]} userAnswers - Выбранные пользователем ответы
 * @param {Object} result - Результат проверки
 * @returns {string} HTML-разметка отзыва
 */
async function generateAiFeedbackForMultipleChoice(userAnswers, result) {
    // Получаем подробности о правильных ответах
    const answerLabels = {};
    document.querySelectorAll('.answer-option').forEach(option => {
        const input = option.querySelector('input[type="checkbox"]');
        const label = option.querySelector('label');
        if (input && label) {
            answerLabels[input.value] = label.textContent;
        }
    });
    
    // Формируем списки правильных и неправильных ответов
    const correctSelected = userAnswers.filter(a => correctAnswers.beginnerAnswers.includes(a))
        .map(a => answerLabels[a] || a);
    
    const incorrectSelected = userAnswers.filter(a => !correctAnswers.beginnerAnswers.includes(a))
        .map(a => answerLabels[a] || a);
    
    const missed = correctAnswers.beginnerAnswers.filter(a => !userAnswers.includes(a))
        .map(a => answerLabels[a] || a);
    
    try {
        // Получаем актуальные данные из задания
        const taskDescription = currentTask.description || "Анализ ответа API";
        const taskQuestion = currentTask.verificationQuestion || "Найдите несоответствия в ответе API";
        
        // Получаем актуальный ответ API из разных возможных источников
        let apiResponse = "";
        
        // 1. Проверяем, есть ли apiResponse в задании
        if (currentTask.apiResponse) {
            apiResponse = typeof currentTask.apiResponse === 'object' 
                ? JSON.stringify(currentTask.apiResponse, null, 2)
                : currentTask.apiResponse;
        } 
        // 2. Пробуем получить из ответа последнего запроса
        else {
            try {
                // Получаем последний ответ из DOM - текста pre с ответом
                const responseBodyElement = document.getElementById('response-body');
                if (responseBodyElement && responseBodyElement.textContent) {
                    const responseText = responseBodyElement.textContent.trim();
                    if (responseText && responseText !== '[Нет содержимого]') {
                        try {
                            // Пробуем распарсить JSON
                            const responseObj = JSON.parse(responseText);
                            apiResponse = JSON.stringify(responseObj, null, 2);
                        } catch {
                            // Если не удалось распарсить, используем как текст
                            apiResponse = responseText;
                        }
                    }
                }
            } catch (e) {
                console.warn("Не удалось получить последний ответ API из DOM:", e);
            }
        }
        
        // 3. Если ничего не удалось получить, ищем ответ в apiResponses
        if (!apiResponse && currentTask.solution && currentTask.solution.url) {
            const method = currentTask.solution.method || "GET";
            const url = currentTask.solution.url;
            const key = `${method}:${url}`;
            
            try {
                // Импортируем apiResponses (предполагается, что он доступен)
                const { apiResponses } = await import('../data/responses.js');
                if (apiResponses[key] && apiResponses[key].body) {
                    apiResponse = typeof apiResponses[key].body === 'object'
                        ? JSON.stringify(apiResponses[key].body, null, 2)
                        : apiResponses[key].body;
                }
            } catch (e) {
                console.warn("Не удалось получить ответ из apiResponses:", e);
            }
        }
        
        // 4. Если ничего не удалось получить, используем пример из первого задания
        if (!apiResponse) {
            apiResponse = `{
    "id": 1,
    "name": "Иван Петров",
    "email": "ivan@example.com",
    "role": "admin",
    "createdAt": "2024-03-15T10:30:00.000Z"
  }`;
        }
        
        // Получаем требования из задания
        const requirements = currentTask.requirements 
            ? currentTask.requirements.join('\n') 
            : "Требования не указаны";
            
        // Формируем запрос для ИИ с актуальными данными
        const prompt = `
        Оцени ответ студента на задание по API.
        
        Задание: "${taskDescription}"
        
        Вопрос: "${taskQuestion}"
        
        Требования API:
        ${requirements}
        
        Ответ API:
        ${apiResponse}
        
        Правильные ответы: ${correctAnswers.beginnerAnswers.map(a => answerLabels[a] || a).join(', ')}
        
        Что выбрал студент:
        - Верно выбрано: ${correctSelected.length > 0 ? correctSelected.join(', ') : 'ничего'}
        - Неверно выбрано: ${incorrectSelected.length > 0 ? incorrectSelected.join(', ') : 'ничего'}
        - Пропущено: ${missed.length > 0 ? missed.join(', ') : 'ничего'}
        
        Оцени ответ студента. Дай позитивный и полезный отзыв.
        Если все правильно, похвали его. 
        Если есть ошибки, объясни, что он выбрал правильно, а что упустил или выбрал неверно, 
        но не давай прямого указания на правильный ответ - пусть сам подумает.
        Будь дружелюбным и поддерживающим.
        
        Примечание: Основывай свой отзыв на конкретном задании и ответе API, который я предоставил выше.`;
        
        // Получаем ответ через API
        const feedback = await getAnswerFromChatGpt(prompt, { task: currentTask });
        
        return feedback;
    } catch (error) {
        console.error('Ошибка при генерации отзыва ИИ:', error);
        
        // Если не удалось получить отзыв от ИИ, формируем простой отзыв
        return getFallbackFeedback(result, correctSelected, incorrectSelected, missed);
    } 
  }

/**
* Получение резервного отзыва, если не удалось получить ответ от ИИ
* @private
*/
function getFallbackFeedback(result, correctSelected, incorrectSelected, missed) {
  if (result.success) {
      return '<p>Отлично! Вы правильно определили все несоответствия в ответе API.</p>';
  } else if (result.partial) {
      return `
          <p>Вы на правильном пути! Вы верно определили часть несоответствий.</p>
          <p>Обратите внимание:</p>
          <ul>
              ${correctSelected.length > 0 ? `<li>Вы правильно выбрали: ${correctSelected.join(', ')}</li>` : ''}
              ${incorrectSelected.length > 0 ? `<li>Однако некоторые выбранные вами пункты не являются несоответствиями</li>` : ''}
              ${missed.length > 0 ? `<li>Есть еще несоответствия, которые вы не отметили</li>` : ''}
          </ul>
          <p>Попробуйте еще раз!</p>
      `;
  } else {
      return `
          <p>Увы, ваш ответ неверный. Давайте разберемся:</p>
          <ul>
              ${correctSelected.length > 0 ? `<li>Вы правильно выбрали: ${correctSelected.join(', ')}</li>` : ''}
              ${incorrectSelected.length > 0 ? `<li>Некоторые выбранные вами пункты не являются несоответствиями</li>` : ''}
              ${missed.length > 0 ? `<li>Вы пропустили важные несоответствия</li>` : ''}
          </ul>
          <p>Внимательно изучите ответ API и сравните его с требованиями в документации.</p>
      `;
  }
}

/**
 * Показывает результаты проверки ответа
 * @param {Object} result - Результат проверки
 * @param {string} feedback - Отзыв ИИ
 */
function showResults(result, feedback) {
    // Показываем блок результатов
    const resultsBlock = document.getElementById('verification-results');
    if (!resultsBlock) return;
    
    // Получаем корректные данные о результатах
    const correctCount = result.details?.correctCount || 0;
    const incorrectCount = result.details?.incorrectCount || 0;
    const missedCount = result.details?.missedCount || 0;
    
    // Формируем HTML блока результатов
    resultsBlock.innerHTML = `
        <div class="result-header">
            <h4>Результат проверки:</h4>
            <div class="result-status">
                <span class="status-icon ${result.success ? 'success' : result.partial ? 'partial' : 'error'}">
                    <i class="fas fa-${result.success ? 'check-circle' : result.partial ? 'exclamation-circle' : 'times-circle'}"></i>
                </span>
                <span class="status-text">${result.success ? 'Правильный ответ!' : result.partial ? 'Частично правильный ответ' : 'Неверный ответ'}</span>
            </div>
        </div>
        
        <div class="result-statistics">
            <div class="stat-item correct">
                <div class="stat-icon"><i class="fas fa-check"></i></div>
                <div class="stat-value">${correctCount}</div>
                <div class="stat-label">Правильно</div>
            </div>
            <div class="stat-item incorrect">
                <div class="stat-icon"><i class="fas fa-times"></i></div>
                <div class="stat-value">${incorrectCount}</div>
                <div class="stat-label">Неверно</div>
            </div>
            <div class="stat-item missed">
                <div class="stat-icon"><i class="fas fa-exclamation"></i></div>
                <div class="stat-value">${missedCount}</div>
                <div class="stat-label">Пропущено</div>
            </div>
        </div>
        
        <div class="ai-feedback">
            <div class="ai-feedback-header">
                <h4><i class="fas fa-robot"></i> Комментарий:</h4>
            </div>
            <div class="ai-feedback-content">
                ${feedback}
            </div>
        </div>
    `;
    
    // Подсвечиваем правильные и неправильные ответы в режиме 'multiple-choice'
    if (currentMode === 'multiple-choice') {
        highlightAnswers(result);
    }
    
    // Добавляем отзыв в ассистент, но не дублируем его
    // Это единственное место, где мы добавляем сообщение в ассистент
    aiAssistant.addAiMessage(`
        <div class="verification-result-summary">
            <h4>${result.success ? 'Отлично!' : result.partial ? 'Частично верно!' : 'Неверно!'}</h4>
            ${feedback}
        </div>
    `);
}

/**
* Подсвечивает правильные и неправильные ответы
* @param {Object} result - Результат проверки
*/
function highlightAnswers(result) {
    const correctAnswerSet = new Set(correctAnswers.beginnerAnswers);
    const userAnswers = [];
    
    // Собираем ответы пользователя
    document.querySelectorAll('input[name="answer"]:checked').forEach(input => {
        userAnswers.push(input.value);
    });
    
    const userAnswerSet = new Set(userAnswers);
    
    // Подсвечиваем варианты ответов
    document.querySelectorAll('.answer-option').forEach(option => {
        const input = option.querySelector('input[type="checkbox"]');
        if (!input) return;
        
        const answerValue = input.value;
        
        // Удаляем все классы подсветки
        option.classList.remove('correct', 'incorrect', 'missed');
        
        if (userAnswerSet.has(answerValue)) {
            // Пользователь выбрал этот ответ
            if (correctAnswerSet.has(answerValue)) {
                // Правильный ответ
                option.classList.add('correct');
            } else {
                // Неправильный ответ
                option.classList.add('incorrect');
            }
        } else if (correctAnswerSet.has(answerValue)) {
            // Пользователь пропустил правильный ответ
            option.classList.add('missed');
        }
    });
}

/**
* Обновляет прогресс задания при правильном ответе
*/
function updateTaskProgress() {
    if (!currentTask) return;
    
    try {
        // Помечаем задание как завершенное
        markTaskAsCompleted(currentTask.id);
        
        // Показываем уведомление
        showNotification('Поздравляем! Вы успешно выполнили задание.', 'success');
        
        // Генерируем событие завершения задания
        emit('taskCompleted', { taskId: currentTask.id });
    } catch (error) {
        console.error('Ошибка при обновлении прогресса задания:', error);
    }
}

/**
* Сбрасывает состояние проверки
*/
function resetVerification() {
    // Сбрасываем флаг выполнения проверки
    verificationInProgress = false;
    
    // Скрываем блок результатов
    const resultsBlock = document.getElementById('verification-results');
    if (resultsBlock) {
        resultsBlock.style.display = 'none';
    }
    
    // Сбрасываем выбранные ответы
    document.querySelectorAll('input[name="answer"]').forEach(input => {
        input.checked = false;
    });
    
    // Очищаем свободный ответ
    const freeAnswer = document.getElementById('free-answer');
    if (freeAnswer) {
        freeAnswer.value = '';
    }
    
    // Сбрасываем подсветку ответов
    document.querySelectorAll('.answer-option').forEach(option => {
        option.classList.remove('correct', 'incorrect', 'missed');
    });
}

/**
* Экспортируем публичный API модуля
*/
export default {
    initVerificationTab,
    resetVerification,
    checkAnswer
};