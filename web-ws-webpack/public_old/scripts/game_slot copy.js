//import { Socket } from 'socket.io';
import utils from './utils.js'

var size = [1920, 1080];
    var ratio = size[0] / size[1];

    const pixiApp = new PIXI.Application(
        {
            autoResize: true,
            resolution: devicePixelRatio
        });
    //{ backgroundColor: 0x1099bb, width: window.innerWidth, height: window.innerHeight });
    //document.body.appendChild(pixiApp.view);
    var element = document.getElementById('pixi');
    if (element.children.length>0) element.removeChild(element.children[0]);
    element.appendChild(pixiApp.view);

    const loader = new PIXI.Loader(); //'{{{{BASEURL}}}}' + '/public');
    loader
        .add('heart.png', 'img/heart.png')
        .add('7.png', 'img/7.png')
        .add('lemon.png', 'img/lemon.png')
        .add('zucca.png', 'img/zucca.png')
        .add('uva.png', 'img/uva.png')
        .add('cherry.png', 'img/cherry.png')
        .add('diamond.png', 'img/diamond.png')
        .load(onAssetsLoaded);

    const reels = [];
    const SHOW_SYMB_IN_REEL = 1;

    const SYMBOL_SIZE = 100;
    const REEL_WIDTH = 150;
    let running = false;
    let stopping = false;
    let winningNumbersResult = false;
    let totalElapsed = 0;
    let elapsed = 0.0;
    //var winningNumbersResult;
    var stopDelay = utils.getRandomIntInclusive( 50, 80 );

    var slotTextures;
    var headerText;
    var topG;

    const Wins = {
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

    function setHeaderText( text ) {
        headerText.text = text;
        headerText.x = Math.round((topG.width - headerText.width) / 2);
    }

    // onAssetsLoaded handler builds the example.
    function onAssetsLoaded() {
        // Create different slot symbols.
        slotTextures = [
            PIXI.Texture.from('heart.png'),
            PIXI.Texture.from('7.png'),
            PIXI.Texture.from('lemon.png'),
            PIXI.Texture.from('zucca.png'),
            PIXI.Texture.from('uva.png'),
            PIXI.Texture.from('cherry.png'),
            PIXI.Texture.from('diamond.png'),
        ];

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


        const margin = (pixiApp.screen.height - SHOW_SYMB_IN_REEL * SYMBOL_SIZE) / 2;

        const reelContainer = new PIXI.Container();
        reelContainer.y = margin;
        reelContainer.x = Math.round(pixiApp.screen.width - REEL_WIDTH * 5);
        //reelContainer.addChild(bunny);

        for (let i = 0; i < 5; i++) {
            // CREATE A REEL CONTAINER
            const rc = new PIXI.Container();
            rc.x = i * REEL_WIDTH;
            reelContainer.addChild(rc);

            const reel = {
                position: Math.floor(Math.random() * slotTextures.length)
            };
            reels.push(reel);

            reel.symbol = new PIXI.Sprite(slotTextures[reel.position]);
            // Scale the symbol to fit symbol area.
            reel.symbol.y = 0;
            reel.symbol.scale.x = reel.symbol.scale.y = Math.min(SYMBOL_SIZE / reel.symbol.width, SYMBOL_SIZE / reel.symbol.height);
            reel.symbol.x = Math.round((SYMBOL_SIZE - reel.symbol.width) / 2);

            reel.turnSpeed = utils.getRandomIntInclusive( 5, 10 );
            reel.turnElapsed = 0;
            //reel.stopLatency = Math.floor(Math.random() * 50);

            rc.addChild( reel.symbol );
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
        pixiApp.stage.addChild(reelContainer);

        topG = new PIXI.Graphics();
        topG.beginFill(0, 1);
        topG.drawRect(0, 0, pixiApp.screen.width, margin);

        const bottomG = new PIXI.Graphics();
        bottomG.beginFill(0, 1);
        bottomG.drawRect(0, SYMBOL_SIZE * SHOW_SYMB_IN_REEL + margin, pixiApp.screen.width, margin);

        // Add play text
        const style = new PIXI.TextStyle({
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

        const playText = new PIXI.Text('Spin the wheels!', style);
        playText.x = Math.round((bottomG.width - playText.width) / 2);
        playText.y = pixiApp.screen.height - margin + Math.round((margin - playText.height) / 2);
        bottomG.addChild(playText);

        // Add header text
        headerText = new PIXI.Text('Slot Machine', style);
        headerText.x = Math.round((topG.width - headerText.width) / 2);
        headerText.y = Math.round((margin - headerText.height) / 2);
        topG.addChild(headerText);

        pixiApp.stage.addChild(reelContainer);
        pixiApp.stage.addChild(topG);
        pixiApp.stage.addChild(bottomG);

        bottomG.interactive = true;
        bottomG.buttonMode = true;
        bottomG.addListener('pointerdown', () => {
            startPlay();
        });

        

        // Reels done handler.
        //function reelsComplete() {
        //    running = false;
        //}

        resize();
    }

    // Function to start playing.
    function startPlay() {
            console.log('startPlay');
            if (running) return;

            socket.emit(msg.Type.GameSlotPlay, (data) => {
                console.log('GameSlotPlay data', data);
                if (data.error) {
                    setError( data.msg );
                    return;
                }
                winningNumbersResult = data.result;
                stopping = true;
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

        function stopSlot() {
            running = false;
            stopping = true;
            totalElapsed = 0;
            elapsed = 0;
            winningNumbersResult = null;
        }

    //let moved = 0;
    // Add a variable to count up the seconds our demo has been running
    

    // Tell our application's ticker to run a new callback every frame, passing
    // in the amount of time that has passed since the last tick
    pixiApp.ticker.add((delta) => {

        if (running) {
            //elapsed += delta;
            totalElapsed += delta;
            //console.log( totalElapsed );

            // aspetto un po' prima di fermare i rulli anche se ho già il risultato
            var reallyStopping = totalElapsed > stopDelay ? stopping : false;

            //if (reallyStopping) console.log( winningNumbers );

            if ( reallyStopping &&
                ( winningNumbersResult.numbers[0] == reels[0].position+1 ) &&
                ( winningNumbersResult.numbers[1] == reels[1].position+1 ) &&
                ( winningNumbersResult.numbers[2] == reels[2].position+1 ) &&
                ( winningNumbersResult.numbers[3] == reels[3].position+1 ) &&
                ( winningNumbersResult.numbers[4] == reels[4].position+1 )
            ){
                running = false;

                if ( winningNumbersResult.win ) {
                    setHeaderText( Object.keys(Wins)[winningNumbersResult.hand] + '\nYou WIN '+winningNumbersResult.money+' credits!' );
                }
                else {
                    setHeaderText( 'Sorry !' );
                }

                return;
            }

            for (let i = 0; i < 5; i++) {
            
                turnReel( i, winningNumbersResult, reallyStopping, delta );
                
            }

/*
            if (elapsed > 10) {
                //console.log( 'elapsed' );
                elapsed = 0;

                for (let i = 0; i < 5; i++) {

                    if ( reallyStopping ) {
                        console.log( 'stopping', winningNumbersResult.numbers[i], (reels[i].position)+1 );
                        // sono arrivato sul numero corretto
                        if ( winningNumbersResult.numbers[i] == (reels[i].position)+1 ) {
                            console.log( 'OK', i );
                            continue;
                        }
                    }

                    reels[i].position++;
                    if (reels[i].position >= slotTextures.length) {
                        reels[i].position = 0;
                    }

                    reels[i].symbol.texture = slotTextures[reels[i].position];

                    //reels[i].symbol = new PIXI.Sprite( slotTextures[reels[i].position] );
                    //reels[i].symbol.y = 0;
                    //reels[i].symbol.scale.x = reels[i].symbol.scale.y = Math.min(SYMBOL_SIZE / reels[i].symbol.width, SYMBOL_SIZE / reels[i].symbol.height);
                    //reels[i].symbol.x = Math.round((SYMBOL_SIZE - reels[i].symbol.width) / 2);
                }

            }
*/
        }


            // Add the time to our total elapsed time
            //elapsed += delta;
            /*
                        let speed = 1;
                        let move = delta * speed;
                        moved += move;
                        // Update the sprite's X position based on the cosine of our elapsed time.  We divide
                        // by 50 to slow the animation down a bit...
                        //sprite.x = 100.0 + Math.cos(elapsed/50.0) * 100.0;
            
                        for (let i = 0; i < reels.length; i++) {
                            r = reels[i];
            
                            for (let j = 0; j < r.symbols.length; j++) {
                                const s = r.symbols[j];
                                //const prevy = s.y;
                                s.y -= delta * speed;
                                //if (s.y <0) s.y = j * SYMBOL_SIZE;
                                if (moved > SYMBOL_SIZE * 7) {
                                    s.y = j * SYMBOL_SIZE;
                                    moved = 0;
                                }
                                /*s.y = ((r.position + j) % r.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE;
                                if (s.y < 0 && prevy > SYMBOL_SIZE) {
                                    // Detect going over and swap a texture.
                                    // This should in proper product be determined from some logical reel.
                                    s.texture = slotTextures[Math.floor(Math.random() * slotTextures.length)];
                                    s.scale.x = s.scale.y = 
                                }*
                            }
                        }
                    }
    */
    });


    function turnReel( numReel, winningNumbersResult, reallyStopping, delta ) {
        let reel = reels[numReel];

        reel.turnElapsed += delta;

        if ( reel.turnElapsed > reel.turnSpeed ) {
            //console.log( 'elapsed' );
            reel.turnElapsed = 0;
            
            if ( reallyStopping ) {
                //console.log( 'stopping', winningNumbersResult.numbers[numReel], (reel.position)+1 );
                // sono arrivato sul numero corretto
                if ( winningNumbersResult.numbers[numReel] == (reel.position)+1 ) {
                    console.log( 'END', numReel );
                    return;
                }
            }

            reel.position++;
            if (reel.position >= slotTextures.length) {
                reel.position = 0;
            }

            reel.symbol.texture = slotTextures[reel.position];
        }
    }

    window.addEventListener('resize', resize);

    function resize() {
        const parent = pixiApp.view.parentNode;

        if (parent.clientWidth / parent.clientHeight >= ratio) {
            var w = parent.clientHeight * ratio;
            var h = parent.clientHeight;
        } else {
            var w = parent.clientWidth;
            var h = parent.clientWidth / ratio;
        }
        pixiApp.view.style.width = w + 'px';
        pixiApp.view.style.height = h + 'px';
    }
    window.onresize = resize;