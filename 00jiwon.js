
fetch('/policeQuiz', {
    method: 'POST', 
    credentials: 'same-origin', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ action : 'police_oxQuiz' })
  })
  .then(response => response.json())
  .then(data => {
    const quizData = data.quiz;
    let points = 0;
    let value = -1;
  
    const policeQuiz = document.getElementById('police-ox-quiz');
    policeQuiz.innerHTML = `
        <p>${JSON.stringify(quizData.q, null, 2)}</p>
        <p>점수: ${points}</p>
    `;
        
    document.querySelector('#police-O').addEventListener('click', () => {
        value = 1;
        if (value === quizData.a) {
            alert('맞았습니다!');
            points += quizData.point;
        }
        else if (value !== quizData.a) {
            alert('틀렸습니다!');
        }
        value = -1;
    });
    document.querySelector('#police-X').addEventListener('click', () => {
        value = 0;
        if (value === quizData.a) {
            alert('맞았습니다!');
            points += quizData.point;
        }
        else if (value !== quizData.a) {
            alert('틀렸습니다!');
        }
        value = -1;
    });
  });