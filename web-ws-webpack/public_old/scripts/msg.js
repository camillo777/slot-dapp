export default class msg {

    static Type = {
        Play: 0,
        Jackpot: 1,
        UserAmount: 2,
        Welcome: 3,
        GetEmptyRooms: 4,
        JoinRoom: 5,
        GameSlotPlay: 6
    }

    constructor( msgString ) {
        let json = JSON.parse( msgString );
        this.type = json.type;
        this.data = json.data;
    }

    static create(type, data) {
        return JSON.stringify({
            type: type,
            data: data
        });
    }

}