const count = document.querySelector('#count');
document.querySelector('#increment').addEventListener('click', () => { count.value = String(Number(count.value) + 1); });
document.querySelector('#reset').addEventListener('click', () => { count.value = '0'; });
