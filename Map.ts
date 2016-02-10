module TiledChunks {

    export class Map
    {
        game: Phaser.Game;
        container: Phaser.Group;
        data: TiledChunks.MapData;
        chunks: TiledChunks.Chunk[][];
        
        centerChunk: TiledChunks.Chunk;
        cameraChunkRow: number;
        cameraChunkColumn: number;

        listeners: TiledChunks.MapListener[];
        layers: TiledChunks.MapLayer[];
        colliders: Phaser.Sprite[];


        // DEBUG
        triggerChecks: number;
        collisionChecks: number;
        chunksDrawn: number;



        // ----------------------------------------------------------------------------------------------
        // ----------------------------------- MAP EVENT HANDLING ---------------------------------------
        // ----------------------------------------------------------------------------------------------

        public AddListener(_event: string, _callback: Function): void
        {
            this.listeners.push(new TiledChunks.MapListener(_event, _callback));
        }

        public RemoveListener(_event: string) : void
        {
            
        }

        public OnTriggerEnter(_trigger: TiledChunks.TriggerSprite, _collider: Phaser.Sprite): void {
            for (var l: number = 0; l < this.listeners.length; l++)
                if (this.listeners[l].event == "OnTriggerEnter")
                    this.listeners[l].callback(_trigger, _collider);
        }

        public OnTriggerLeave(_trigger: TiledChunks.TriggerSprite, _collider: Phaser.Sprite): void {
            for (var l: number = 0; l < this.listeners.length; l++) 
                if (this.listeners[l].event == "OnTriggerLeave")
                    this.listeners[l].callback(_trigger, _collider);
        }
        
        // ----------------------------------------------------------------------------------------------
        // ----------------------------------- MAP EVENT HANDLING ---------------------------------------
        // ----------------------------------------------------------------------------------------------

        
        public GetLayer(_name: string): TiledChunks.MapLayer {
            var i:number = 0;
            while (i < this.layers.length && this.layers[i].data.name != _name)
                i++;
            return this.layers[i];
        }

        public AddToLayer(_sprite: any, _layer: string, _collider: boolean): void {
            var layer: MapLayer = this.GetLayer(_layer);
            layer.container.add(_sprite);
            if (_collider)
                this.colliders.push(_sprite);
        }

        public UpdateChunksAround(_cR: number, _cC: number): void {

            for (var r: number = 0; r < this.chunks.length; r++)
                for (var c: number = 0; c < this.chunks[r].length; c++)
                    this.chunks[r][c].PrematureDeactivation();

            this.centerChunk = this.chunks[_cR][_cC];
            

            this.centerChunk.Activate();
            this.centerChunk.ActivateAdjacent();

            for (var r: number = 0; r < this.chunks.length; r++) 
                for (var c: number = 0; c < this.chunks[r].length; c++)
                    this.chunks[r][c].DeactivationCheck();
        }

        public IsCollidingWithSimmilarTrigger(_collider: Phaser.Sprite, _chunk: TiledChunks.Chunk, _triggerIndex: number): boolean {
            for (var c: number = 0; c < _chunk.triggers.length; c++)
                if (c != _triggerIndex && _chunk.triggers[c].name == _chunk.triggers[_triggerIndex].name && _chunk.triggers[c].entered)
                    return true;
            return false;
        }

        public UpdateCollisionOnChunk(_chunk: TiledChunks.Chunk): void {


            for (var i: number = 0; i < this.colliders.length; i++) {
                for (var c: number = 0; c < _chunk.colliders.length; c++) {
                    this.game.physics.arcade.collide(this.colliders[i], _chunk.colliders[c]);
                    this.collisionChecks++;
                }
                for (var t: number = 0; t < _chunk.triggers.length; t++) {
                    this.triggerChecks++;
                    if (this.game.physics.arcade.overlap(this.colliders[i], _chunk.triggers[t])) {
                        if (!_chunk.triggers[t].entered) {
                            _chunk.triggers[t].entered = true;
                            // A collider will only enter a trigger
                            // if it is not colliding with any other simmilar triggers
                            if (!this.IsCollidingWithSimmilarTrigger(this.colliders[i], _chunk, t))
                                this.OnTriggerEnter(_chunk.triggers[t], this.colliders[i]);
                        }
                    }
                    else {
                        if (_chunk.triggers[t].entered) {
                            _chunk.triggers[t].entered = false;
                            // A collider will only leave a trigger
                            // if it no longer collides with any other simmilar triggers
                            if (!this.IsCollidingWithSimmilarTrigger(this.colliders[i], _chunk, t))
                                this.OnTriggerLeave(_chunk.triggers[t], this.colliders[i]);
                        }
                    }
                }
            }
        }
           

        public UpdateCollisions(): void 
        {
            this.UpdateCollisionOnChunk(this.centerChunk);
            for (var a: number = 0; a < this.centerChunk.adjacentCollisionChunks.length; a++)
                this.UpdateCollisionOnChunk(this.centerChunk.adjacentCollisionChunks[a]);
        }

        public UpdateMap(): void {
            

            var camera_centerX: number = this.game.camera.x + (this.game.camera.width / 2);
            var camera_centerY: number = this.game.camera.y + (this.game.camera.height / 2)

            var camera_chunkRow: number = Math.floor(camera_centerY / this.data.chunkHeight);
            var camera_chunkColumn: number = Math.floor(camera_centerX / this.data.chunkWidth);

            if (camera_chunkRow != this.cameraChunkRow || camera_chunkColumn != this.cameraChunkColumn) {
                this.cameraChunkRow = camera_chunkRow;
                this.cameraChunkColumn = camera_chunkColumn;
                this.UpdateChunksAround(this.cameraChunkRow, this.cameraChunkColumn);
            }

            this.UpdateCollisions();
        }

        public CacheAdjacentChunks(): void {
            for (var r: number = 0; r < this.chunks.length; r++) {
                for (var c: number = 0; c < this.chunks[r].length; c++) {
                    this.chunks[r][c].CacheAdjacentChunks(this.data.chunkNeedCacheHorizontal, this.data.chunkNeedCacheVertical);
                }
            }
            this.OutputCachedChunks();
        }

        /*
            So we want to resize the world viewport

        */
        public ResizeViewport(_newWidth: number, _newHeight: number): void {
            this.data.viewportWidth = _newWidth;
            this.data.viewportHeight = _newHeight;

            // Recalculate needed chunk cache sizes
            this.data.CalculateNeededChunkCacheSizes();

            // Now recache world chunk adjacent graphical chunks
            this.LoadCachedChunks(false);
        }


        public LoadCachedChunks(_cacheNowIfNotFound: boolean): void {

            var ref = this;
            var jsonLoader: Phaser.Loader = new Phaser.Loader(this.game);
            jsonLoader.json("adjacentChunksCache", "assets/adjacent_caches/" + this.data.viewportWidth + "x" + this.data.viewportHeight + "x" + this.data.chunkNeedCacheHorizontal + "x" + this.data.chunkNeedCacheVertical + "x" + this.data.chunkTileRows + "x" + this.data.chunkTileColumns + ".json");
            jsonLoader.onLoadComplete.addOnce(function () {
                var cacheJSON: JSON = this.game.cache.getJSON("adjacentChunksCache");
                if (cacheJSON) {
                    var adjacentChunksCache: number[][][] = cacheJSON["chunks"];
                    for (var r: number = 0; r < adjacentChunksCache.length; r++) {
                        for (var c: number = 0; c < adjacentChunksCache[r].length; c++) {
                            ref.chunks[r][c].adjacentGraphicalChunks = [];
                            ref.chunks[r][c].CacheAdjacentCollisionChunks();
                            for (var a: number = 0; a < adjacentChunksCache[r][c].length; a++) {
                                ref.chunks[r][c].adjacentGraphicalChunks.push(ref.chunks[adjacentChunksCache[r][c][a][0]][adjacentChunksCache[r][c][a][1]]);
                            }
                        }
                    }
                }
                else {
                    console.log("Could not find cached ajdacent chunks JSON");
                    if (_cacheNowIfNotFound)
                        ref.CacheAdjacentChunks();
                }
            }, this);
            jsonLoader.start();

        }

        public OutputCachedChunks(): void {
            var output: string = "{ \"chunkTileRows\": " + this.data.chunkTileRows + ", \"chunkTileColumns\": " + this.data.chunkTileColumns + ", \"chunks\":[";
            var chunk: TiledChunks.Chunk;
            var adjacentChunk: TiledChunks.Chunk;
            for (var r: number = 0; r < this.chunks.length; r++) {
                output += "[";
                for (var c: number = 0; c < this.chunks[r].length; c++) {
                    chunk = this.chunks[r][c];
                    output += "[";
                    for (var a: number = 0; a < chunk.adjacentGraphicalChunks.length; a++) {
                        adjacentChunk = chunk.adjacentGraphicalChunks[a];
                        output += "[" + adjacentChunk.coord.row + "," + adjacentChunk.coord.column + "]";
                        if (a + 1 < chunk.adjacentGraphicalChunks.length)
                            output += ",";
                    }
                    output += "]";
                    if (c + 1 < this.chunks[r].length)
                        output += ",";
                }
                output += "]";
                if (r + 1 < this.chunks.length)
                    output += ",";
            }
            prompt("Adjacent Chunks CACHE",output + "]}");
        }

        constructor(_game: Phaser.Game, _data: TiledChunks.MapData)
        {
            this.game = _game;
            this.data = _data;
            this.container = new Phaser.Group(_game);
            this.colliders = [];
            this.collisionChecks = 0;
            this.triggerChecks = 0;
            this.chunksDrawn = 0;

            console.log(_data.tilesets);


            // Create a group for each layer
            this.listeners = [];
            this.layers = [];
            var layerContainer: any;
            var layerData: TiledChunks.LayerData;
            for (var l: number = 0; l < this.data.layers.length; l++)
            {
                layerData = this.data.layers[l];
                if (layerData.batch)
                    layerContainer = new Phaser.SpriteBatch(this.game, this.container, layerData.name);
                else
                    layerContainer = new Phaser.Group(this.game, this.container, layerData.name);
                this.layers.push(new TiledChunks.MapLayer(layerContainer, layerData));
            }

            // Create the Chunks
            this.chunks = [];
            var chunk: Chunk;
            for (var r: number = 0; r < this.data.chunkRows; r++) {
                this.chunks[r] = [];
                for (var c: number = 0; c < this.data.chunkColumns; c++) {
                    chunk = new TiledChunks.Chunk(this, r, c);
                    this.chunks[r][c] = chunk;
                }
            }

            // Each chunk has adjacent chunks 
            // around it, we cache them so
            // we dont have to calculate it later

            this.LoadCachedChunks(false);
            this.UpdateMap();

            console.log(this.data.tilesets);

            
            
            console.log("Created chunks: " + Chunk.chunks);
            console.log("Created tiles: " + Tile.tiles);
        }
    }
}