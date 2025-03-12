class ASCIIBird {
    constructor() {
        // Game elements
        this.gameScreen = document.getElementById('game-screen');
        this.scoreDisplay = document.getElementById('score');
        this.highScoreDisplay = document.getElementById('high-score');
        this.finalScoreDisplay = document.getElementById('final-score');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        
        // Load sound effects
        this.sounds = {
            flap: new Audio('Sounds/jump.wav'),
            score: new Audio('Sounds/pickupCoin.wav'),
            gameOver: new Audio('Sounds/synth.wav')
        };
        
        // Adjust sound volumes
        this.sounds.flap.volume = 0.5;
        this.sounds.score.volume = 0.5;
        this.sounds.gameOver.volume = 0.6; // Slightly louder for impact
        
        // Game state
        this.isGameRunning = false;
        this.score = 0;
        this.highScore = localStorage.getItem('asciibird-highscore') || 0;
        this.highScoreDisplay.textContent = `High Score: ${this.highScore}`;
        
        // Game dimensions
        this.updateDimensions();
        window.addEventListener('resize', () => this.updateDimensions());
        
        // Game objects
        this.bird = {
            x: Math.floor(this.cols / 4),
            y: Math.floor(this.rows / 2),
            velocity: 0,
            frameCount: 0,
            animationSpeed: 6 // Controls flapping animation speed
        };
        
        this.pipes = [];
        this.pipeTimer = 0;
        this.pipeInterval = 150; // Increased from 100 to 150 for more space between pipes
        
        // Colors for ASCII art
        this.colors = {
            bird: ['0', '1', '2', '3', '4', '5', '6', '7'], // Different color indices
            pipe: ['[', ']', '{', '}', '(', ')', '-', '=', '7', '/', '\\', '_']
        };
        
        // Ground level
        this.groundLevel = Math.floor(this.rows * 0.85);
        
        // Controls
        window.addEventListener('keydown', this.handleKeyPress.bind(this));
        window.addEventListener('touchstart', this.handleTap.bind(this));
        
        // Start game loop
        this.lastTimestamp = 0;
        this.frameCount = 0;
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    updateDimensions() {
        const computedStyle = window.getComputedStyle(this.gameScreen);
        this.fontSize = parseFloat(computedStyle.fontSize);
        
        // Calculate how many characters fit in the game screen
        this.cols = Math.floor(this.gameScreen.clientWidth / (this.fontSize * 0.6));
        this.rows = Math.floor(this.gameScreen.clientHeight / this.fontSize);
        
        // Ensure minimum size
        this.cols = Math.max(this.cols, 80);
        this.rows = Math.max(this.rows, 40);
    }
    
    handleKeyPress(event) {
        if (event.code === 'Space') {
            event.preventDefault();
            
            if (!this.isGameRunning) {
                this.startGame();
            } else {
                this.flapBird();
            }
        }
    }
    
    handleTap(event) {
        event.preventDefault();
        
        if (!this.isGameRunning) {
            this.startGame();
        } else {
            this.flapBird();
        }
    }
    
    startGame() {
        this.isGameRunning = true;
        this.score = 0;
        this.scoreDisplay.textContent = `Score: ${this.score}`;
        this.bird.y = Math.floor(this.rows / 2);
        this.bird.velocity = 0;
        this.lastFlapTime = null;
        this.pipes = [];
        this.pipeTimer = 0;
        
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
    }
    
    endGame() {
        this.isGameRunning = false;
        this.finalScoreDisplay.textContent = this.score;
        
        // Play game over sound
        this.playSound('gameOver');
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('asciibird-highscore', this.highScore);
            this.highScoreDisplay.textContent = `High Score: ${this.highScore}`;
        }
        
        this.gameOverScreen.classList.remove('hidden');
    }
    
    flapBird() {
        // Much gentler flap strength
        this.bird.velocity = -0.4; // Reduced from -0.6 to -0.4 for minimal bounce
        
        // Play flap sound
        this.playSound('flap');
        
        // Prevent excessive flapping by setting a minimum time between flaps
        const currentTime = Date.now();
        if (!this.lastFlapTime || currentTime - this.lastFlapTime > 200) {
            this.lastFlapTime = currentTime;
        } else {
            // Weaker subsequent flaps if too soon
            this.bird.velocity = -0.25;
        }
    }
    
    updateBird() {
        // Apply ultra-light gravity
        this.bird.velocity += 0.008;
        
        // Add terminal velocity to prevent falling too fast
        if (this.bird.velocity > 0.4) {
            this.bird.velocity = 0.4;
        }
        
        // Limit upward velocity as well
        if (this.bird.velocity < -0.5) {
            this.bird.velocity = -0.5;
        }
        
        this.bird.y += this.bird.velocity;
        
        // Animate bird
        this.bird.frameCount++;
        
        // Check ceiling and floor collision
        if (this.bird.y < 0) {
            this.bird.y = 0;
            this.bird.velocity = 0;
        }
        
        if (this.bird.y >= this.groundLevel - 3) {
            this.bird.y = this.groundLevel - 3;
            this.endGame();
        }
    }
    
    spawnPipe() {
        const gapHeight = 18; // Increased from 14 to 18 for a much larger gap
        const gapPosition = Math.floor(Math.random() * (this.groundLevel - gapHeight - 14)) + 7;
        
        this.pipes.push({
            x: this.cols,
            gapStart: gapPosition,
            gapEnd: gapPosition + gapHeight,
            scored: false
        });
    }
    
    updatePipes() {
        this.pipeTimer++;
        
        if (this.pipeTimer >= this.pipeInterval) {
            this.spawnPipe();
            this.pipeTimer = 0;
        }
        
        // Update pipe positions and check for scoring/collision
        for (let i = 0; i < this.pipes.length; i++) {
            const pipe = this.pipes[i];
            // Even slower pipe movement
            pipe.x -= 0.3; // Reduced from 0.5 to 0.3 for slower pipe movement
            
            // Check if pipe is off-screen
            if (pipe.x + 14 < 0) {
                this.pipes.splice(i, 1);
                i--;
                continue;
            }
            
            // Check for scoring
            if (!pipe.scored && pipe.x < this.bird.x) {
                this.score++;
                this.scoreDisplay.textContent = `Score: ${this.score}`;
                pipe.scored = true;
                
                // Play score sound
                this.playSound('score');
            }
            
            // Check for collision
            if (this.isColliding(pipe)) {
                this.endGame();
            }
        }
    }
    
    isColliding(pipe) {
        // Bird's position is more detailed now
        const birdLeft = this.bird.x;
        const birdRight = this.bird.x + 5;
        const birdTop = Math.floor(this.bird.y);
        const birdBottom = Math.ceil(this.bird.y) + 2;
        
        // Check if bird is within pipe's x-range
        if (birdRight >= pipe.x && birdLeft <= pipe.x + 14) {
            // Check if bird is outside the gap
            if (birdTop < pipe.gapStart || birdBottom >= pipe.gapEnd) {
                return true;
            }
        }
        
        return false;
    }
    
    render() {
        let screen = Array(this.rows).fill().map(() => Array(this.cols).fill(' '));
        
        // Draw sky - using various ASCII characters for a textured background
        for (let y = 0; y < this.groundLevel; y++) {
            for (let x = 0; x < this.cols; x++) {
                // Use different characters based on position to create a textured effect
                if ((x + y) % 19 === 0) screen[y][x] = '|';
                else if ((x * y) % 23 === 0) screen[y][x] = '`';
                else if ((x - y) % 29 === 0) screen[y][x] = '\'';
                else if ((x * y) % 31 === 0) screen[y][x] = '.';
                else screen[y][x] = ' ';
            }
        }
        
        // Draw pipes with complex ASCII art
        for (const pipe of this.pipes) {
            // Top pipe
            for (let y = 0; y < pipe.gapStart; y++) {
                for (let x = 0; x < 14; x++) {
                    const screenX = Math.floor(pipe.x + x);
                    if (screenX >= 0 && screenX < this.cols) {
                        // Pipe edge
                        if (x === 0) {
                            screen[y][screenX] = '|';
                        } else if (x === 13) {
                            screen[y][screenX] = '|';
                        }
                        // Pipe top
                        else if (y === pipe.gapStart - 1) {
                            screen[y][screenX] = '=';
                        }
                        // Pipe body
                        else {
                            // Create a textured pipe pattern
                            const patternValue = (x + y) % 7;
                            if (patternValue === 0) {
                                screen[y][screenX] = '#';
                            } else if (patternValue === 1) {
                                screen[y][screenX] = '7';
                            } else if (patternValue === 2) {
                                screen[y][screenX] = '/';
                            } else if (patternValue === 3) {
                                screen[y][screenX] = '\\';
                            } else {
                                screen[y][screenX] = '#';
                            }
                        }
                    }
                }
            }
            
            // Bottom pipe
            for (let y = pipe.gapEnd; y < this.groundLevel; y++) {
                for (let x = 0; x < 14; x++) {
                    const screenX = Math.floor(pipe.x + x);
                    if (screenX >= 0 && screenX < this.cols) {
                        // Pipe edge
                        if (x === 0) {
                            screen[y][screenX] = '|';
                        } else if (x === 13) {
                            screen[y][screenX] = '|';
                        }
                        // Pipe top
                        else if (y === pipe.gapEnd) {
                            screen[y][screenX] = '=';
                        }
                        // Pipe body
                        else {
                            // Create a textured pipe pattern
                            const patternValue = (x + y) % 7;
                            if (patternValue === 0) {
                                screen[y][screenX] = '#';
                            } else if (patternValue === 1) {
                                screen[y][screenX] = 'o';
                            } else if (patternValue === 2) {
                                screen[y][screenX] = '{';
                            } else if (patternValue === 3) {
                                screen[y][screenX] = '}';
                            } else {
                                screen[y][screenX] = '#';
                            }
                        }
                    }
                }
            }
        }
        
        // Draw ground
        for (let y = this.groundLevel; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (y === this.groundLevel) {
                    screen[y][x] = '~';
                } else if (y === this.groundLevel + 1) {
                    screen[y][x] = '-';
                } else {
                    // Varied ground texture
                    if ((x + y) % 5 === 0) {
                        screen[y][x] = '.';
                    } else if ((x * y) % 7 === 0) {
                        screen[y][x] = ',';
                    } else if ((x - y) % 9 === 0) {
                        screen[y][x] = ':';
                    } else {
                        screen[y][x] = ' ';
                    }
                }
            }
        }
        
        // Draw bird - much more complex ASCII art bird
        const birdY = Math.floor(this.bird.y);
        const birdX = this.bird.x;
        const angle = this.bird.velocity * 10; // Bird angle based on velocity
        
        // Bird body
        const birdArt = this.getBirdArt(angle);
        
        // Draw the multi-line bird
        for (let i = 0; i < birdArt.length; i++) {
            const line = birdArt[i];
            for (let j = 0; j < line.length; j++) {
                if (birdX + j >= 0 && birdX + j < this.cols && birdY + i >= 0 && birdY + i < this.rows) {
                    if (line[j] !== ' ') {
                        screen[birdY + i][birdX + j] = line[j];
                    }
                }
            }
        }
        
        // Convert screen array to string
        const screenString = screen.map(row => row.join('')).join('\n');
        this.gameScreen.textContent = screenString;
    }
    
    getBirdArt(angle) {
        // Different bird art based on velocity/angle
        // Adjusted thresholds for smoother transitions
        if (angle < -1.5) {
            // Flying up
            return [
                " ^  ",
                "//> ",
                "<```>"
            ];
        } else if (angle > 1.5) {
            // Flying down
            return [
                "<___>",
                " \\\\v ",
                "  v  "
            ];
        } else {
            // Level flight
            return [
                "  __",
                "=//o\\",
                "<<_>"
            ];
        }
    }
    
    gameLoop(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        
        if (this.isGameRunning) {
            this.updateBird();
            this.updatePipes();
        }
        
        this.render();
        this.frameCount++;
        
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    // Helper method to play sounds
    playSound(soundName) {
        try {
            // Create a new instance to allow for overlapping sounds
            const sound = this.sounds[soundName];
            if (sound) {
                // Clone the audio for overlapping sounds
                const soundClone = sound.cloneNode();
                soundClone.volume = sound.volume;
                soundClone.play().catch(e => {
                    // Silently fail if autoplay is blocked by browser
                    console.log('Sound playback failed:', e);
                });
            }
        } catch (error) {
            // Fail silently if sound can't be played
            console.log('Error playing sound:', error);
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new ASCIIBird();
}); 