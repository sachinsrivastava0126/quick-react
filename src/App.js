import React, { useState, useEffect } from 'react';
import 'rbx/index.css';
import { Button, Container, Title } from 'rbx';
import firebase from 'firebase/app';
import 'firebase/database';

//const schedule = {
//  "title": "CS Courses for 2018-2019",
//  "courses": [
//    {
//      "id": "F101",
//      "title": "Computer Science: Concepts, Philosophy, and Connections",
//      "meets": "MWF 11:00-11:50"
//    },
//    {
//      "id": "F110",
//      "title": "Intro Programming for non-majors",
//      "meets": "MWF 10:00-10:50"
//    },
//    {
//      "id": "F111",
//      "title": "Fundamentals of Computer Programming I",
//      "meets": "MWF 13:00-13:50"
//    },
//    {
//      "id": "F211",
//      "title": "Fundamentals of Computer Programming II",
//      "meets": "TuTh 12:30-13:50"
//    }
//  ]
//};



// Your web app's Firebase configuration
var firebaseConfig = {
apiKey: "AIzaSyBR61GLtCrP1VDx34eU2c6l5n0-yPpBfZE",
authDomain: "quick-react-scheduler.firebaseapp.com",
databaseURL: "https://quick-react-scheduler.firebaseio.com",
projectId: "quick-react-scheduler",
storageBucket: "",
messagingSenderId: "661594768034",
appId: "1:661594768034:web:220f0e0d3bc87e5ad84dfb",
measurementId: "G-J7HJFW5YGX"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database().ref();




const Banner = ({ title }) => (
  <Title>{ title || '[loading...]' }</Title>
);

const terms = { F: 'Fall', W: 'Winter', S: 'Spring'};
const days = ['M', 'Tu', 'W', 'Th', 'F'];


const getCourseTerm = course => (
  terms[course.id.charAt(0)]
);

const getCourseNumber = course => (
  course.id.slice(1, 4)
)
  
const Course = ({ course, state }) => (
<Button color={ buttonColor(state.selected.includes(course)) }
    onClick={ () => state.toggle(course) }
    onDoubleClick={ () => moveCourse(course) }
    disabled={ hasConflict(course, state.selected) }
    >
    { getCourseTerm(course) } CS { getCourseNumber(course) }: { course.title }
  </Button>
);

const moveCourse = course => {
  const meets = prompt('Enter new meeting data, in this format:', course.meets);
  if (!meets) return;
  const {days} = timeParts(meets);
  if (days) saveCourse(course, meets); 
  else moveCourse(course);
};

const saveCourse = (course, meets) => {
  db.child('courses').child(course.id).update({meets})
    .catch(error => alert(error));
};



const useSelection = () => {
  const [selected, setSelected] = useState([]);
  const toggle = (x) => {
    setSelected(selected.includes(x) ? selected.filter(y => y !== x) : [x].concat(selected))
  };
  return [ selected, toggle ];
};

const hasConflict = (course, selected) => (
  selected.some(selection => courseConflict(course, selection))
);


const buttonColor = selected => (
  selected ? 'success' : null
);
const TermSelector = ({ state }) => (
  <Button.Group hasAddons>
  { Object.values(terms)
      .map(value => 
        <Button key={value}
          color={ buttonColor(value === state.term) }
          onClick={ () => state.setTerm(value) }
          >
          { value }
        </Button>
      )
  }
  </Button.Group>
);


const CourseList = ({ courses }) => {
  const [term, setTerm] = useState('Fall');
  const [selected, toggle] = useSelection();
  const termCourses = courses.filter(course => term === getCourseTerm(course));
 
  return (
    <React.Fragment>
      <TermSelector state={ { term, setTerm } } />
      <Button.Group>
        { termCourses.map(course =>
           <Course key={ course.id } course={ course }
             state={ { selected, toggle } } />) }
      </Button.Group>
    </React.Fragment>
  );
};



const meetsPat = /^ *((?:M|Tu|W|Th|F)+) +(\d\d?):(\d\d) *[ -] *(\d\d?):(\d\d) *$/;

const timeParts = meets => {
  const [match, days, hh1, mm1, hh2, mm2] = meetsPat.exec(meets) || [];
  return !match ? {} : {
    days,
    hours: {
      start: hh1 * 60 + mm1 * 1,
      end: hh2 * 60 + mm2 * 1
    }
  };
};

const addCourseTimes = course => ({
  ...course,
  ...timeParts(course.meets)
});

const addScheduleTimes = schedule => ({
  title: schedule.title,
  courses: Object.values(schedule.courses).map(addCourseTimes)
});





const daysOverlap = (days1, days2) => ( 
  days.some(day => days1.includes(day) && days2.includes(day))
);

const hoursOverlap = (hours1, hours2) => (
  Math.max(hours1.start, hours2.start) < Math.min(hours1.end, hours2.end)
);

const timeConflict = (course1, course2) => (
  daysOverlap(course1.days, course2.days) && hoursOverlap(course1.hours, course2.hours)
);

const courseConflict = (course1, course2) => (
  course1 !== course2
  && getCourseTerm(course1) === getCourseTerm(course2)
  && timeConflict(course1, course2)
);


const App = () => {
  const [schedule, setSchedule] = useState({ title: '', courses: [] });

  useEffect(() => {
    const handleData = snap => {
      if (snap.val()) setSchedule(addScheduleTimes(snap.val()));
    }
    db.on('value', handleData, error => alert(error));
    return () => { db.off('value', handleData); };
  }, []);

  return (
    <Container>
      <Banner title={ schedule.title } />
      <CourseList courses={ schedule.courses } />
    </Container>
);
};

export default App;