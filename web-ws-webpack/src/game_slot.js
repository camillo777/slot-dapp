//import { Socket } from 'socket.io';
import utils from './utils.js'
import msg from './msg.js'
import { ethers } from 'ethers';
import Config from './config.js';
import { io } from "socket.io-client";
import Button from './pixi_button.js'
import Panel from './pixi_panel.js'
import ethutils from './ethutils.js'

import { Application, Texture, Container, Sprite, Graphics, TextStyle, Text } from "pixi.js";

/*function toGwei(balance) { return ethers.utils.formatUnits(balance, "gwei") };
function toEth(balance) { return ethers.utils.formatUnits(balance, "ether") };
function ether(n) { return ethers.utils.parseEther(string(n)); }
function string(s) { return '' + s; }*/


export default class GameSlot extends Application {
    tag = 'GameSlot';

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

    constructor( element, $bus, roomID, socket ) {
        console.log( 'GameSlot --> constructor' );

        super({
            //width: window.innerWidth,
            //height: window.innerHeight,
            autoResize: true,
            resolution: devicePixelRatio
        })

        this.element = element;
        this.$bus = $bus;
        this.roomID = roomID;
        this.socket = socket;

        this.sampleSize = [1920, 1080];
        this.ratio = this.sampleSize[0] / this.sampleSize[1];

        
        //document.body.appendChild(this.view) // Put Canvas tag in the body

        if (this.element.children.length > 0)
            this.element.removeChild(this.element.children[0]);
        this.element.appendChild(this.view);

        this.init()

        window.addEventListener('resize', this.onResize.bind(this))
    }

    init() {
        console.log( this.tag, 'init' );

        this.reels = [];
        this.SHOW_SYMB_IN_REEL = 1;

        this.SYMBOL_SIZE = 100;
        this.REEL_WIDTH = 150;

        this.initPlay();

        /*this.running = false;
        this.stopping = false;
        this.winningNumbersResult = false;
        this.totalElapsed = 0;
        this.elapsed = 0.0*/
        //var winningNumbersResult;
        this.stopDelay = utils.getRandomIntInclusive(50, 80);

        this.slotTextures;
        this.headerText;
        this.topG;

        this.loader
            .add('heart.png', 'img/heart.png')
            .add('7.png', 'img/7.png')
            .add('lemon.png', 'img/lemon.png')
            .add('zucca.png', 'img/zucca.png')
            .add('uva.png', 'img/uva.png')
            .add('cherry.png', 'img/cherry.png')
            .add('diamond.png', 'img/diamond.png')
            .add('button', './img/button.png')
            .add('button2', './img/button2.png')
            .add('button3', './img/button3.png')
            .add('panel', './img/panel2.png')
        //.load(() => this.onAssetsLoaded());
        this.loader.load( this.draw.bind(this) )
    }

    draw() {
        console.log( this.tag, 'draw' );

        //console.log( PIXI.Texture.from('heart.png') );

        // Create different slot symbols.
        this.slotTextures = [
            Texture.from('heart.png'),
            Texture.from('7.png'),
            Texture.from('lemon.png'),
            Texture.from('zucca.png'),
            Texture.from('uva.png'),
            Texture.from('cherry.png'),
            Texture.from('diamond.png'),
        ];

        console.log(this.tag, 'draw', this.slotTextures);

        //const container = new PIXI.Container();
        //pixiApp.stage.addChild(container);

        //const texture = PIXI.Texture.from('{{{{BASEURL}}}}'+'/assets/7.png'); // replaced by template engine
        //const bunny = new PIXI.Sprite(texture);

        /*
        container.addChild(bunny);
        
        container.x = pixiApp.screen.width / 2;
        container.y = pixiApp.screen.height / 2;
        
        console.log( container.width );
        console.log( container.height );
        */

        // Center bunny sprite in local container coordinates
        //container.pivot.x = container.width / 2;
        //container.pivot.y = container.height / 2;

        console.log(this.tag, 'draw', this.screen.height);

        const margin = (this.screen.height - this.SHOW_SYMB_IN_REEL * this.SYMBOL_SIZE) / 2;
        console.log(this.tag, 'margin', margin);

        const reelContainer = new Container();
        reelContainer.y = margin;
        reelContainer.x = Math.round(this.screen.width - this.REEL_WIDTH * 5);
        //reelContainer.addChild(bunny);

        for (let i = 0; i < 5; i++) {
            // CREATE A REEL CONTAINER
            const rc = new Container();
            rc.x = i * this.REEL_WIDTH;
            reelContainer.addChild(rc);

            let position = Math.floor(Math.random() * this.slotTextures.length);

            const reel = {
                position: position,
                symbol: new Sprite(this.slotTextures[position]),
                turnSpeed: utils.getRandomIntInclusive(5, 10),
                turnElapsed: 0
            };
            this.reels.push(reel);

            //reel.symbol = new PIXI.Sprite( this.slotTextures[reel.position] );
            // Scale the symbol to fit symbol area.
            reel.symbol.y = 0;
            reel.symbol.scale.x = reel.symbol.scale.y = Math.min(
                this.SYMBOL_SIZE / reel.symbol.width,
                this.SYMBOL_SIZE / reel.symbol.height
            );
            reel.symbol.x = Math.round((this.SYMBOL_SIZE - reel.symbol.width) / 2);

            //reel.turnSpeed = utils.getRandomIntInclusive( 5, 10 );
            //reel.turnElapsed = 0;
            //reel.stopLatency = Math.floor(Math.random() * 50);

            rc.addChild(reel.symbol);
        }

        /*
                // Build the reels
                //const reelContainer = new PIXI.Container();
                for (let i = 0; i < 5; i++) {
                    // CREATE A REEL CONTAINER
                    const rc = new PIXI.Container();
                    rc.x = i * REEL_WIDTH;
                    reelContainer.addChild(rc);
        
                    const reel = {
                        container: rc,
                        symbols: [],
                        position: 0,
                        previousPosition: 0,
                        blur: new PIXI.filters.BlurFilter(),
                    };
                    reel.blur.blurX = 0;
                    reel.blur.blurY = 0;
                    rc.filters = [reel.blur];
        
                    // Build the symbols
                    for (let j = 0; j < slotTextures.length; j++) {
                        const symbol = new PIXI.Sprite(slotTextures[Math.floor(Math.random() * slotTextures.length)]);
                        // Scale the symbol to fit symbol area.
                        symbol.y = j * SYMBOL_SIZE;
                        symbol.scale.x = symbol.scale.y = Math.min(SYMBOL_SIZE / symbol.width, SYMBOL_SIZE / symbol.height);
                        symbol.x = Math.round((SYMBOL_SIZE - symbol.width) / 2);
                        reel.symbols.push(symbol);
                        rc.addChild(symbol);
                    }
                    reels.push(reel);
                }
        */
        this.stage.addChild(reelContainer);

        this.topG = new Graphics();
        this.topG.beginFill(0, 1);
        this.topG.drawRect(0, 0, this.screen.width, margin);

        const bottomG = new Graphics();
        bottomG.beginFill(0, 1);
        bottomG.drawRect(0, this.SYMBOL_SIZE * this.SHOW_SYMB_IN_REEL + margin, this.screen.width, margin);

        // Add play text
        const style = new TextStyle({
            fontFamily: 'Arial',
            fontSize: 36,
            fontStyle: 'italic',
            fontWeight: 'bold',
            fill: ['#ffffff', '#00ff99'], // gradient
            stroke: '#4a1850',
            strokeThickness: 5,
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 6,
            wordWrap: true,
            wordWrapWidth: 440,
        });

        const playText = new Text('Spin the wheels!', style);
        playText.x = Math.round((bottomG.width - playText.width) / 2);
        playText.y = this.screen.height - margin + Math.round((margin - playText.height) / 2);
        bottomG.addChild(playText);

        // Add header text
        this.headerText = new Text('Slot Machine', style);
        this.headerText.x = Math.round((this.topG.width - this.headerText.width) / 2);
        this.headerText.y = Math.round((margin - this.headerText.height) / 2);
        this.topG.addChild(this.headerText);

        this.stage.addChild(reelContainer);
        this.stage.addChild(this.topG);
        this.stage.addChild(bottomG);

        bottomG.interactive = true;
        bottomG.buttonMode = true;
        bottomG.addListener('pointerdown', () => {
            this.startPlay();
        });

        this.button1 = new Button({
            label: 'Play',
            width: 200,
            height: 80,
            onTap: () => console.log('Play'),
            texture: 'button3',
            notScalableArea: 38
        })
        this.panelCredits = new Button({
            label: 'Settings',
            width: 300,
            height: 110,
            onTap: () => console.log('Settings'),
            texture: 'panel',
            notScalableArea: 20
        })
        //this.stage.addChild(this.button1, this.panelCredits)

        this.onResize()

        //this.wsConnect();
        this.initSocket();

        // Tell our application's ticker to run a new callback every frame, passing
        // in the amount of time that has passed since the last tick
        this.ticker.add( this.onUpdate.bind(this) );
    }

    onUpdate( delta ) {
        //console.log( 'update', delta );

        if (this.running) {
            //elapsed += delta;
            this.totalElapsed += delta;
            //console.log( totalElapsed );

            // aspetto un po' prima di fermare i rulli anche se ho già il risultato
            var reallyStopping = this.totalElapsed > this.stopDelay ? this.stopping : false;

            //if (reallyStopping) console.log( winningNumbers );

            if (reallyStopping &&
                (this.winningNumbersResult.numbers[0] == this.reels[0].position + 1) &&
                (this.winningNumbersResult.numbers[1] == this.reels[1].position + 1) &&
                (this.winningNumbersResult.numbers[2] == this.reels[2].position + 1) &&
                (this.winningNumbersResult.numbers[3] == this.reels[3].position + 1) &&
                (this.winningNumbersResult.numbers[4] == this.reels[4].position + 1)
            ) {
                this.running = false;

                if (this.winningNumbersResult.win) {
                    console.log('Win', this.winningNumbersResult.hand, this.winningNumbersResult.money);
                    const handName = Object.keys(GameSlot.Wins)[this.winningNumbersResult.hand];
                    this.setHeaderText(`${handName}\nYou WIN ${ethutils.toEth(this.winningNumbersResult.money)} credits!`);
                }
                else {
                    this.setHeaderText('Sorry !');
                }

                this.stopPlay();

                return;
            }

            for (let i = 0; i < 5; i++) {
                this.turnReel(i, this.winningNumbersResult, reallyStopping, delta);
            }
        }
    }

    onResize() {
        /*this.renderer.resize(window.innerWidth, window.innerHeight)
        const width = this.renderer.width, height = this.renderer.height
 
        const btnMargin = 5
        this.button1.x = width * 0.5
        this.button1.y = height * 0.5 - this.button1.height * 0.5 - btnMargin
 
        this.button2.x = width * 0.5
        this.button2.y = height * 0.5 + this.button2.height * 0.5 + btnMargin*/

        const parent = this.view.parentNode;

        if (parent.clientWidth / parent.clientHeight >= this.ratio) {
            var w = parent.clientHeight * this.ratio;
            var h = parent.clientHeight;
        } else {
            var w = parent.clientWidth;
            var h = parent.clientWidth / this.ratio;
        }
        this.view.style.width = w + 'px';
        this.view.style.height = h + 'px';

        const btnMargin = 5
        this.button1.x = w * 0.5
        this.button1.y = h * 0.5 - this.button1.height * 0.5 - btnMargin

        this.panelCredits.x = w * 0.5
        this.panelCredits.y = h * 0.5 + this.panelCredits.height * 0.5 + btnMargin
    }

    setHeaderText(text) {
        this.headerText.text = text;
        this.headerText.x = Math.round((this.topG.width - this.headerText.width) / 2);
    }

    wsConnect() {
        console.log('wsConnect');

        if (this.socket) {
            this.socket.close();
        }

        this.socket = io({ path: Config.BASE_PATH + '/socket.io' });
        console.log(this.socket);
    }

    initSocket() {
        console.log('initSocket');
/*
        if (this.socket) {
            this.socket.close();
        }

        this.socket = io({ path: Config.BASE_PATH + '/socket.io' });
        console.log(this.socket);

        // client-side
        this.socket.on("connect", () => {
            console.log('connect', this.socket.id); // x8WIv7-mJelg7on_ALbx
        });
*/
        this.socket.on('disconnect', () => {
            console.log('user disconnected');
        });
        this.socket.on('error', (e) => {
            console.log('user error:'+e);
        });

        this.socket.on(msg.Type.RequireLogin, (e) => {
            console.log('requires login:'+e);
        });

        // client-side
        this.socket.on(msg.Type.Jackpot, (arg1) => {
            console.log(arg1); // 1
            //console.log(arg2); // "2"
            //console.log(arg3); // { 3: '4', 5: ArrayBuffer (1) [ 6 ] }
            console.log('jackpot result', arg1);
            this.$bus.$emit('result', arg1);
            //txtJackpotAmount.innerText = toEth( arg1 );
        });

        this.socket.on(msg.Type.UserAmount, (arg1) => {
            console.log(arg1); // 1
            //console.log(arg2); // "2"
            //console.log(arg3); // { 3: '4', 5: ArrayBuffer (1) [ 6 ] }
            console.log('UserAmount result', arg1);
            this.$bus.$emit('userAmount', arg1);
            //txtUserAmount.innerText = toEth( arg1 );
        });

        this.socket.on(msg.Type.Welcome, (arg1) => {
            //console.log(arg1); // 1
            //console.log(arg2); // "2"
            //console.log(arg3); // { 3: '4', 5: ArrayBuffer (1) [ 6 ] }
            console.log('Welcome result', arg1);
        });
    }

    // Funcion to start playing.
    startPlay() {
        console.log('startPlay');

        if ( !this.socket.connected ) {
            this.setHeaderText( 'ERROR: Socket not connected!' );
            return;
        }

        if (this.running) {
            console.log('Already running')
            return;
        }

        this.running = true;
        this.setHeaderText('Spinning...');

        // send message to back
        this.socket.emit(msg.Type.GameSlotPlay, { roomID: this.roomID }, (result) => {
            console.log('GameSlotPlay result', result);
            if (result.error) {
                //setError(result.msg);
                this.$bus.$emit('error', result.msg);
                this.error();
                return;
            }
            this.winningNumbersResult = {
                numbers: result.data.numbers,
                win: result.data.win,
                hand: result.data.hand,
                money: ethers.BigNumber.from(result.data.money),
                jackpotAmount: ethers.BigNumber.from(result.data.jackpotAmount),
                userAmount: ethers.BigNumber.from(result.data.userAmount)
            };
            this.stopping = true;
        });
        /*
                    if ( vm.isLoggedIn() ) {
        
                        running = true;
                        stopping = false;
                        totalElapsed = 0;
                        elapsed = 0;
                        winningNumbersResult = null;
        
                        setHeaderText( 'Spinning...' );
        
                        vm.play();
                    }
                    else {
                        setHeaderText( 'Please login with your wallet to play' );
                    }
        */
        /*
        for (let i = 0; i < reels.length; i++) {
            const r = reels[i];
            const extra = Math.floor(Math.random() * 3);
            const target = r.position + 10 + i * 5 + extra;
            const time = 2500 + i * 600 + extra * 600;
            tweenTo(r, 'position', target, time, backout(0.5), null, i === reels.length - 1 ? reelsComplete : null);
        }
        */
    }

    stopPlay() {
        console.log('userAmount', this.winningNumbersResult.userAmount);
        const userAmount = this.winningNumbersResult.userAmount; //ethers.BigNumber.from( this.winningNumbersResult.userAmount );
        this.$bus.$emit('userAmount', { amount: userAmount });

        this.initPlay();
        //this.setHeaderText("Slot game")
    }

    error() {
        console.log('error');
        this.initPlay();
        this.setHeaderText("ERROR")
    }

    initPlay() {
        this.running = false;
        this.stopping = false;
        this.totalElapsed = 0;
        this.elapsed = 0;
        this.winningNumbersResult = null;
    }

    //let moved = 0;
    // Add a variable to count up the seconds our demo has been running

    turnReel(numReel, winningNumbersResult, reallyStopping, delta) {
        let reel = this.reels[numReel];

        reel.turnElapsed += delta;

        if (reel.turnElapsed > reel.turnSpeed) {
            //console.log( 'elapsed' );
            reel.turnElapsed = 0;

            if (reallyStopping) {
                //console.log( 'stopping', winningNumbersResult.numbers[numReel], (reel.position)+1 );
                // sono arrivato sul numero corretto
                if (winningNumbersResult.numbers[numReel] == (reel.position) + 1) {
                    console.log('END', numReel);
                    return;
                }
            }

            reel.position++;
            if (reel.position >= this.slotTextures.length) {
                reel.position = 0;
            }

            reel.symbol.texture = this.slotTextures[reel.position];
        }
    }

}