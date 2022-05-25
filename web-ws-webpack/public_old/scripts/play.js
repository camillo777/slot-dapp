import { assert } from "chai";

export default class play {

    static Wins = {
        none: 0,
        three_of_a_kind: 1,
        three_seven: 2,
        four_seven: 3,
        four_of_a_kind: 4,
        two_pairs: 5,
        full_house: 6,
        five_of_a_kind: 7,
        five_seven: 8,
      }

    static getLuckyNumbers() {
        return [ 
            this.generateNumber(),
            this.generateNumber(),
            this.generateNumber(),
            this.generateNumber(),
            this.generateNumber()
          ];
    }

/*
none: 0,
three_of_a_kind: 1,
three_seven: 2,
four_seven: 3,
four_of_a_kind: 4,
two_pairs: 5,
full_house: 6,
five_of_a_kind: 7,
five_seven: 8,
*/
  static checkEqualNumbers( n ) {
    console.log( 'checkEqualNumbers', n );
    let list = [0,0,0,0,0,0,0];
    for(let i=0; i<n.length; i++) {
      let result = n[i];
      list[n[i]]++; 
    }
    console.log( 'list', list );
    assert( list.reduce((previousValue, currentValue) => previousValue + currentValue) == 5, `Sum must be 5 ${n} ${list}`)
    return list;
  }
  static findTimesOf( number, list ) {
    console.log( 'findTimesOf', number );
    var numberOfList = [];
    for(let i=0; i<list.length; i++) {
      if (list[i] == number) numberOfList.push( i );
    }
    return numberOfList.length;
  }
  static checkWin( n ) {
    console.log( 'checkWin', n );
    let l = this.checkEqualNumbers( n );
    if (l[1]==5) 
      return this.Wins.five_seven;
    if (l[0]==5 || l[1]==5 || l[2]==5 || l[3]==5 || l[4]==5 || l[5]==5 || l[6]==5 || l[7]==5)
      return this.Wins.five_of_a_kind;
    if (l[1]==4) 
      return this.Wins.four_seven;
    if (l[0]==4 || l[1]==4 || l[2]==4 || l[3]==4 || l[4]==4 || l[5]==4 || l[6]==4 || l[7]==4)
      return this.Wins.four_of_a_kind;
    if ( this.findTimesOf(2,l)>0 && this.findTimesOf(3,l)>0 )
      return this.Wins.full_house;
    if (l[1]==3) 
      return this.Wins.three_seven;
    if (l[0]==3 || l[1]==3 || l[2]==3 || l[3]==3 || l[4]==3 || l[5]==3 || l[6]==3 || l[7]==3)
      return this.Wins.three_of_a_kind;
    if ( this.findTimesOf(2,l)==2 )
      return this.Wins.two_pairs;
    return this.Wins.none;
  }
/*
# possible combinations: 7*7*7*7*7 = 16807
# 5 seven = (77777) 1/(7*7*7*7*7) prob of five seven
# 4 seven = (7777x 7x777 77x77 777x7 7777x) 5/16807
# 5 of a kind = 6/16807
# 4 of a kind = 30
# 3 seven = ( 777xx 77x7x 77xx7, 7x77x, 7x7x7, 7xx77 ) = 6
# 3 of a kind = 6*6 = 36



*/
  static getMoneyForWin( win ) {
    console.log( 'getMoneyForWin', win );
    let money = 0;
    if (win == this.Wins.five_of_a_kind) money = 250; //(7*7*7*7)/7; //1/(7*7*7*7);
    if (win == this.Wins.four_seven) money = 50; //(7*6*5*4)/7; //1/(7*7*7*7);
    if (win == this.Wins.four_of_a_kind) money = 15; //(7*7*7)/7; //1/(7*7*7);
    if (win == this.Wins.full_house) money = 5; //(7*7)+7; // 1/(7*7) + 1/7
    if (win == this.Wins.three_seven) money = 6; // (7*6*5)/7; //1/(7*7*7);
    if (win == this.Wins.three_of_a_kind) money = 1.5; //(7*7)/7; //1/(7*7);
    if (win == this.Wins.two_pairs) money = 1; //7/7; //1/7;
    //if (win != Wins.none) return 1;
    //return Math.floor( money );
    return money;
  }
  static generateNumber() {
    return Math.floor(Math.random() * 6) + 1; // 1 - 7
  }

}