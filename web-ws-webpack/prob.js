import { assert } from "chai";


function generateNumber() {
    return Math.floor(Math.random() * 7); // 0 - 6
}
function generate5() {
    return [
        generateNumber(),
        generateNumber(),
        generateNumber(),
        generateNumber(),
        generateNumber()
    ]
}

var counters = [0,0,0,0,0,0,0]

const NUM = 100000

var n = 0;
for(let i=0; i<NUM; i++) {
    n = generateNumber()
    counters[n]++;
}

counters.forEach( (c, index) => console.log(`${index}: ${c}`) )

var probs = [0,0,0,0,0,0,0];
counters.forEach( (c, index) => probs[index] = c/NUM )

console.log( counters.reduce((p,n)=>p+n) )

probs.forEach( (c, index) => console.log(`${index}: ${c}`) )

var five_7 = 0;
var five_n = 0;
var five_not7 = 0;
var four_7 = 0;
var four_n = 0;
var four_not7 = 0;
var three_7 = 0;
var three_n = 0;
var three_not7 = 0;
var double_n = 0;
var fullhouse_n = 0;

var r7777 = 0;

var five;
for(let i=0; i<NUM; i++) {
    five = generate5();

    let jj = 0;
    if (five[0]==6) jj++;
    if (five[1]==6) jj++;
    if (five[2]==6) jj++;
    if (five[3]==6) jj++;
    if (five[4]==6) jj++;
    if (jj == 4) r7777++;
    
    if //(five[0]==five[1]==five[2]==five[3]==five[4]) 
    (
        timesOf(0,five)==5 ||
        timesOf(1,five)==5 || 
        timesOf(2,five)==5 || 
        timesOf(3,five)==5 || 
        timesOf(4,five)==5 || 
        timesOf(5,five)==5 || 
        timesOf(6,five)==5
        ){
        five_n++;
        if (five[0]==6) five_7++;
        if (five[0]!=6) five_not7++;
    }
    else if (
        timesOf(0,five)==4 ||
        timesOf(1,five)==4 || 
        timesOf(2,five)==4 || 
        timesOf(3,five)==4 || 
        timesOf(4,five)==4 || 
        timesOf(5,five)==4 || 
        timesOf(6,five)==4
        )
    {
        four_n++;
        if (timesOf(6,five)==4) four_7++;
        else four_not7++;
    }
    else if ( checkEqualNumbers(five).two == 1 && checkEqualNumbers(five).three == 1) {
        fullhouse_n++;
    }
    else if (
        timesOf(0,five)==3 ||
        timesOf(1,five)==3 || 
        timesOf(2,five)==3 || 
        timesOf(3,five)==3 || 
        timesOf(4,five)==3 || 
        timesOf(5,five)==3 || 
        timesOf(6,five)==3
        )
    {
        three_n++;
        if (timesOf(6,five)==3) three_7++;
        else three_not7++;
    }
    else if ( checkEqualNumbers(five).two == 2 ) {
        double_n++;
    }
}

function checkEqualNumbers( n ) {
    //console.log( 'checkEqualNumbers', n );
    let list = [0,0,0,0,0,0,0];
    assert(n.length == 5); // numeri estratti
    assert(list.length == 7); // possibili risultati
    for(let i=0; i<n.length; i++) {
      let result = n[i];
      list[result]++; 
    }
    //console.log( 'list', list );
    assert( list.reduce((previousValue, currentValue) => previousValue + currentValue) == 5, `Sum must be 5 ${n} ${list}`)

    let result = {
        two:0,
        three:0,
        four:0,
        five:0
    };
    list.forEach(
        (times) => {
            if (times==2) result.two++
            else if (times==3) result.three++
            else if (times==4) result.four++
            else if (times==5) result.five++
        }
    )

    return result;
  }

  function timesOf( number, list ) {
    //console.log( 'findTimesOf', number );
    let n = 0;
    assert( list.length == 5 );
    for(let i=0; i<list.length; i++) {
      if (list[i] == number) n++;
    }
    return n;
  }

const possibilities = 7*7*7*7*7

console.log( `five_7:           ${five_7}    ${five_7/NUM}` );
//console.log( `five_numbers:             ${five_n} ${five_n/NUM}`);
console.log( `five_not7:        ${five_not7}    ${five_not7/NUM}`);
console.log( `four_7:           ${four_7}    ${four_7/NUM}` );
console.log( `r7777:           ${r7777}    ${r7777/NUM}` );
//console.log( `four_numbers:             ${four_n} ${four_n/NUM}`);
console.log( `four_not7:        ${four_not7}     ${four_not7/NUM}`);
console.log( `full_house:       ${fullhouse_n}    ${fullhouse_n/NUM}` );
console.log( `three_7:          ${three_7}    ${three_7/NUM}` );
//console.log( `three_numbers:            ${three_n} ${three_n/NUM}`);
console.log( `three_not7:       ${three_not7}    ${three_not7/NUM}`);
console.log( `double:           ${double_n}    ${double_n/NUM}` );

function log(name, n) {
    console.log( `${name}:\t${n} ${n/NUM} ${100*n/NUM}%` );
}
/*
log( 'five_7', five_7 );
log( 'five_not7', five_not7 );
assert(five_7+five_not7==five_n);
//log( 'five_n', five_n );
log( 'four_7', four_7 );
log( 'four_not7', four_not7 );
//log( 'four_n', four_n );
assert(four_7+four_not7==four_n);
log( 'three_7', three_7 );
log( 'fullhouse', fullhouse_n );
log( 'three_not7', three_not7 );
assert(three_7+three_not7==three_n);
//log( 'three_n', three_n );
log( 'double_n', double_n );
*/
let probWin = (five_n + four_n + three_n + fullhouse_n + double_n)/NUM;
console.log(`Winning probability: ${probWin} ${100*probWin}%`);

let num90 = NUM*0.9

/*
five_7:	    61      0.000061    0.0061%
five_not7:	363     0.000363    0.0363%
four_7:	    1767    0.001767    0.1767%
four_not7:	10787   0.010787    1.0787%
three_7:	17715   0.017715    1.7715%
fullhouse:	24931   0.024931    2.4931%
three_not7:	107027  0.107027    10.7027%
double_n:	187959  0.187959    18.7959%

Winning probability: 0.35061    35.061%

five_7 : 0.35 = x : 1 => x = 0.000061/0.35 = 0.00017
five_not7 : 0.35 = x : 1 => x = 0.000363/0.35 = 0.0010
four_7 : 0.35 = x : 1 => x = 0.001767/0.35 = 0.005
*/



let totalWins = /*double_n*1 +*/ three_not7*1 + fullhouse_n*5 + three_7*10 + four_not7*50 + four_7*100 + five_not7*500 + five_7*1000;
console.log( 'totalWins', totalWins );

// 100 : NUM = x : n => x = 100 * n / NUM
/*
const Hands = {
    five_seven: 0,
    five_not7: 1,
    four_seven: 2,
    four_not7: 3,
    full_house: 4,
    three_seven: 5,
    three_not7: 6,
    double: 7,
}

const probs = []
probs[Hands.five_seven] = five_seven/NUM
probs[Hands.five_not7] = five_not7/NUM
probs[Hands.four_seven] = four_seven/NUM
probs[Hands.four_not7] = four_n_not7/NUM
probs[Hands.full_house] = fullhouse_n/NUM
probs[Hands.three_seven] = three_seven/NUM
probs[Hands.three_not7] = three_n_not7/NUM
probs[Hands.double] = double_n/NUM

for(let i=0; i<probs.length; i++) {
    
    const handName = Object.keys(Hands)[i];

    console.log( `${handName} ` );

}
*/
                        