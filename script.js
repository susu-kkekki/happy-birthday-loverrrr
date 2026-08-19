// Game Flow Manager
let currentStage = 1;
let ingredientsAdded = 0;
let toppingsAdded = 0;
let biscuitTaps = 0;
let poofCallbackTimer;
let poofHideTimer;

function updateInstruction(text) {
  document.getElementById('instruction').innerText = text;
}

function triggerPoof(callback, duration = 1200) {
  const poof = document.getElementById('poof-cloud');
  clearTimeout(poofCallbackTimer);
  clearTimeout(poofHideTimer);
  poof.classList.remove('hidden');
  poof.classList.remove('poof-effect');
  void poof.offsetWidth;
  poof.classList.add('poof-effect');
  
  poofCallbackTimer = setTimeout(() => {
    if (callback) callback();
  }, duration);

  poofHideTimer = setTimeout(() => {
    poof.classList.add('hidden');
  }, duration + 250);
}

// STAGE 1: TAP BISCUITS, THEN MIX THE CRUST
document.getElementById('img-main').addEventListener('click', tapBiscuits);

function tapBiscuits() {
  if (currentStage !== 1) return;

  biscuitTaps++;
  triggerPoof();
  updateInstruction(`Tap the biscuits ${5 - biscuitTaps} more time${5 - biscuitTaps === 1 ? '' : 's'}!`);

  if (biscuitTaps >= 5) {
    document.getElementById('img-main').classList.add('hidden');
    document.getElementById('img-crushed').classList.remove('hidden');
    document.getElementById('img-crushed').classList.add('drag-ready');
    document.getElementById('img-butter').classList.remove('hidden');
    updateInstruction('Drag the crushed biscuits into the melted butter!');
  }
}

function handlePrimaryAction() {
  if (currentStage === 1) {
    setupStage2();
  } else if (currentStage === 2 && document.getElementById('fridge-overlay').classList.contains('hidden')) {
    setupStage3Toppings();
  }
}

// STAGE 2: FILLING PREPARATION & DRAG-AND-DROP
function setupStage2() {
  currentStage = 2;
  document.getElementById('img-main').classList.add('hidden');
  document.getElementById('img-crushed').classList.add('hidden');
  document.getElementById('img-butter').classList.add('hidden');
  document.getElementById('img-bowl').classList.remove('hidden');
  updateInstruction("Stage 2: Drag cream cheese & powdered sugar into the bowl!");
  document.getElementById('img-ingredient-sugar').classList.remove('hidden');
  document.getElementById('img-ingredient-cheese').classList.remove('hidden');
  document.getElementById('btn-action').innerText = 'Next stage';
  document.getElementById('action-bar').classList.add('hidden');
}

function enableDragAndDrop() {
  const draggables = document.querySelectorAll('.draggable-ingredient, .draggable-topping');
  const target = document.getElementById('kitchen-scene');
  let touchDrag;

  draggables.forEach(el => {
    el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', e.target.id);
    });

    el.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      const rect = el.getBoundingClientRect();
      const preview = el.cloneNode(true);

      e.preventDefault();
      preview.classList.remove('hidden');
      preview.classList.add('touch-drag-preview');
      preview.style.width = `${rect.width}px`;
      preview.style.height = `${rect.height}px`;
      document.body.appendChild(preview);
      touchDrag = { id: el.id, element: el, preview, offsetX: rect.width / 2, offsetY: rect.height / 2 };
      moveTouchPreview(touch);
    }, { passive: false });
  });

  target.addEventListener('dragover', (e) => e.preventDefault());

  target.addEventListener('drop', (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const draggedEl = document.getElementById(id);
    processDrop(id, draggedEl);
  });

  document.addEventListener('touchmove', (e) => {
    if (!touchDrag) return;
    e.preventDefault();
    moveTouchPreview(e.touches[0]);
  }, { passive: false });

  document.addEventListener('touchend', (e) => {
    if (!touchDrag) return;
    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    const dragged = touchDrag;

    if (dropTarget && target.contains(dropTarget)) {
      processDrop(dragged.id, dragged.element);
    }

    dragged.preview.remove();
    touchDrag = null;
  });

  function moveTouchPreview(touch) {
    touchDrag.preview.style.left = `${touch.clientX - touchDrag.offsetX}px`;
    touchDrag.preview.style.top = `${touch.clientY - touchDrag.offsetY}px`;
  }
}

function processDrop(id, draggedEl) {
  if (!draggedEl) return;

  draggedEl.classList.add('hidden');

  if (currentStage === 1 && id === 'img-crushed') {
      updateInstruction('Mixing crushed biscuits into the melted butter...');
      triggerPoof(() => {
        document.getElementById('img-main').classList.remove('hidden');
        document.getElementById('img-main').src = 'crust.png';
        document.getElementById('img-main').classList.add('crust-target');
        document.getElementById('img-butter').classList.add('hidden');
        document.getElementById('btn-action').innerText = 'Next stage: Make the filling';
        document.getElementById('action-bar').classList.remove('hidden');
        updateInstruction('Your crust is ready!');
      }, 3000);
    } else if (id === 'img-ingredient-filling') {
      updateInstruction('Placing the filling on the crust...');
      triggerPoof(() => {
        document.getElementById('img-main').src = 'crust_and_filling.png';
        runFridgeTimer();
      }, 3000);
    } else if (currentStage === 2) {
      ingredientsAdded++;
      if (ingredientsAdded === 2) {
        updateInstruction("Whisking filling...");
        triggerPoof(() => {
          document.getElementById('img-bowl').classList.add('hidden');
          document.getElementById('img-ingredient-filling').classList.remove('hidden');
          document.getElementById('img-main').classList.remove('hidden');
          document.getElementById('img-main').src = 'crust.png';
          document.getElementById('img-main').classList.add('crust-target');
          updateInstruction("Drag the prepared filling bowl onto the crust!");
        }, 3000);
      }
    } else if (currentStage === 3) {
      const toppingOrder = ['img-topping-berries', 'img-topping-cream', 'img-topping-candles'];
      if (id !== toppingOrder[toppingsAdded]) {
        draggedEl.classList.remove('hidden');
        updateInstruction(`Add ${toppingOrder[toppingsAdded].replace('img-topping-', '')} next!`);
        return;
      }

      toppingsAdded++;
      triggerPoof(() => {
        if (id === 'img-topping-berries') {
          document.getElementById('img-main').src = 'berry_topping.png';
          updateInstruction('Now add the whipped cream!');
        } else if (id === 'img-topping-cream') {
          document.getElementById('img-main').src = 'both_toppings.png';
          updateInstruction('Now add the candles!');
        } else {
          currentStage = 4;
          document.getElementById('img-main').src = 'cheesecake_blownout_candles.png';
          document.getElementById('lighter-tool').classList.remove('hidden');
          document.getElementById('unlit-lighter').classList.remove('hidden');
          document.getElementById('lit-lighter').classList.add('hidden');
          updateInstruction("Tap the lighter to light the birthday candles!");
        }
      });
  }
}

enableDragAndDrop();

// FRIDGE TIMER (5 SECONDS)
function runFridgeTimer() {
  const fridge = document.getElementById('fridge-overlay');
  const timerEl = document.getElementById('fridge-timer');
  let timeLeft = 5;

  fridge.classList.remove('hidden');
  updateInstruction('Chilling Cheesecake...');
  const interval = setInterval(() => {
    timeLeft--;
    timerEl.innerText = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(interval);
      fridge.classList.add('hidden');
      document.getElementById('btn-action').innerText = 'Next stage: Add toppings';
      document.getElementById('action-bar').classList.remove('hidden');
      updateInstruction('The crust and filling are cool!');
    }
  }, 1000);
}

// STAGE 3: TOPPINGS
function setupStage3Toppings() {
  currentStage = 3;
  document.getElementById('action-bar').classList.add('hidden');
  updateInstruction("Stage 3: Drag whipped cream & berries onto the cheesecake!");
  document.getElementById('img-topping-cream').classList.remove('hidden');
  document.getElementById('img-topping-berries').classList.remove('hidden');
  document.getElementById('img-topping-candles').classList.remove('hidden');
  updateInstruction('Add the berries first, then whipped cream, then candles!');
}

// STAGE 4: CANDLES, LIGHTER & BLOWOUT
function setupStage4() {
  currentStage = 4;
}

function lightCandles() {
  document.getElementById('unlit-lighter').classList.add('hidden');
  triggerPoof(() => {
    document.getElementById('lit-lighter').classList.remove('hidden');
    document.getElementById('img-main').src = 'cheesecake_lit_candles.png';
    updateInstruction("Blow into mic / tap cake to blow out candles!");
    document.getElementById('img-main').onclick = blowOutCandles;
  });
}

function blowOutCandles() {
  triggerPoof(() => {
    document.getElementById('img-main').src = 'cheesecake_blownout_candles.png';
    document.getElementById('lit-lighter').classList.add('hidden');
    document.getElementById('unlit-lighter').classList.remove('hidden');
    document.getElementById('lighter-tool').classList.remove('hidden');
    
    // Confetti burst
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

    document.getElementById('birthday-wall-sign').classList.remove('hidden');
    document.getElementById('birthday-wall-sign').setAttribute('aria-hidden', 'false');
    updateInstruction('Cut the cake to reveal your birthday card!');
    
    document.getElementById('action-bar').innerHTML = `
      <button class="btn" onclick="revealBirthdayCard()">Cut Cake & Reveal Birthday Card 🎂</button>
    `;
    document.getElementById('action-bar').classList.remove('hidden');
  });
}

// REVEAL SCREEN
function revealBirthdayCard() {
  document.getElementById('reveal-screen').classList.remove('hidden');
  confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 } });
}
