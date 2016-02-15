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

        public AddListener(_sprite: Phaser.Sprite, _event: string, _callback: Function): void
        {
            this.listeners.push(new TiledChunks.MapListener(_sprite, _event, _callback));
        }

        public RemoveListener(_event: string) : void
        {
            
        }

        public OnTriggerEnter(_trigger: TiledChunks.TriggerSprite, _collider: Phaser.Sprite): void {
            for (var l: number = 0; l < this.listeners.length; l++)
                if (this.listeners[l].event == "OnTriggerEnter" && this.listeners[l].sprite.name == _collider.name)
                    this.listeners[l].callback(_trigger);
        }

        public OnTriggerLeave(_trigger: TiledChunks.TriggerSprite, _collider: Phaser.Sprite): void {
            for (var l: number = 0; l < this.listeners.length; l++)
                if (this.listeners[l].event == "OnTriggerLeave" && this.listeners[l].sprite.name == _collider.name)
                    this.listeners[l].callback(_trigger);
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

        public AddToLayer(_sprite: any, _layer: string, _isCollider: boolean): void {
            var layer: MapLayer = this.GetLayer(_layer);
            layer.container.add(_sprite);
            if (_isCollider)
                this.AddCollider(_sprite);
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

        public IsCollidingWithSimmilarTrigger(_collider: Phaser.Sprite, _trigger: TiledChunks.TriggerSprite, _chunk: TiledChunks.Chunk, _propagating?: boolean): boolean
        {
            var c: number = 0;
            while (c < _chunk.triggers.length && (_chunk.triggers[c] == _trigger || !_chunk.triggers[c].HasCollider(_collider))) 
                c++;
            if (c < _chunk.triggers.length)
                return true;
            else if(!_propagating) {
                var a: number = 0;
                while (a < _chunk.adjacentCollisionChunks.length && !this.IsCollidingWithSimmilarTrigger(_collider, _trigger, _chunk.adjacentCollisionChunks[a],true))
                    a++;
                return a < _chunk.adjacentCollisionChunks.length;
            }
        }

        public AddCollider(_collider: Phaser.Sprite): void {
            this.colliders.push(_collider);
        }

        public RemoveCollider(_collider: Phaser.Sprite): void {
            var c: number = 0;
            while (c < this.colliders.length && this.colliders[c] != _collider)
                c++;
            if (c < this.colliders.length)
                this.colliders.splice(c, 1);
        }

        public UpdateCollisionOnChunk(_chunk: TiledChunks.Chunk): void {

            var collider: Phaser.Sprite;
            var tile: Phaser.Sprite;
            var trigger: TriggerSprite;

            for (var i: number = 0; i < this.colliders.length; i++) {

                collider = this.colliders[i];


                // Check collision between collider and tiles
                for (var c: number = 0; c < _chunk.colliders.length; c++) {
                    tile = _chunk.colliders[c];
                    this.game.physics.arcade.collide(collider, tile);
                    this.collisionChecks++;
                }

                for (var t: number = 0; t < _chunk.triggers.length; t++) {
                    this.triggerChecks++;

                    trigger = _chunk.triggers[t];

                    if (this.game.physics.arcade.overlap(collider, trigger)) {
                        if (!trigger.HasCollider(collider)) {
                            trigger.AddCollider(collider);
                            // A collider will only enter a trigger
                            // if it is not colliding with any other simmilar triggers
                            if (!this.IsCollidingWithSimmilarTrigger(collider, trigger, _chunk))
                                this.OnTriggerEnter(trigger, collider);
                        }
                    }
                    else if (trigger.HasCollider(collider)) {
                        trigger.RemoveCollider(collider);
                        // A collider will only leave a trigger
                        // if it no longer collides with any other simmilar triggers
                        if (!this.IsCollidingWithSimmilarTrigger(collider, trigger, _chunk))
                            this.OnTriggerLeave(trigger, collider);
                    }
                }
            }
        }
           

        public UpdateCollisions(): void 
        {
            this.UpdateCollisionOnChunk(this.centerChunk);
            if (this.centerChunk.adjacentCollisionChunks)
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

        public CacheAdjacentChunks(_cacheVisual: boolean): void {
            for (var r: number = 0; r < this.chunks.length; r++) {
                for (var c: number = 0; c < this.chunks[r].length; c++) {
                    this.chunks[r][c].CacheAdjacentChunks(this.data.chunkNeedCacheHorizontal, this.data.chunkNeedCacheVertical, _cacheVisual);
                }
            }
            if (_cacheVisual)
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
                    ref.CacheAdjacentChunks(_cacheNowIfNotFound);
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


        public GetTilesOnLayer(_layerName: string): TiledChunks.Tile[] {
            var returnTiles: TiledChunks.Tile[] = [];
            var chunk: TiledChunks.Chunk;
            var foundLayer: boolean = false;
            for (var r: number = 0; r < this.chunks.length; r++) {
                for (var c: number = 0; c < this.chunks[r].length; c++) {
                    chunk = this.chunks[r][c];
                    // Find the layer
                    var l = 0;
                    while (l < chunk.layers.length && chunk.layers[l].layer.name != _layerName)
                        l++;
                    if (l < chunk.layers.length) {
                        foundLayer = true;
                        var layer: TiledChunks.ChunkLayer = chunk.layers[l];
                        for (var tR: number = 0; tR < layer.tiles.length; tR++)
                            if (layer.tiles[tR]) 
                                for (var tC: number = 0; tC < layer.tiles[tR].length; tC++)
                                    if (layer.tiles[tR][tC])
                                        returnTiles.push(layer.tiles[tR][tC]);
                    }
                }
            }
            if (!foundLayer)
                console.log("Could not find any " + _layerName + " named layers");
            return returnTiles
        }

        public GetTilesOnLayerByProperty(_layer: string, _property: string, _value: string): TiledChunks.Tile[] {
            var tiles: TiledChunks.Tile[] = this.GetTilesOnLayer(_layer);
            var tile: TiledChunks.Tile;
            var tileset: TiledChunks.Tileset;
            var returnTiles: TiledChunks.Tile[] = [];
            for (var t: number = 0; t < tiles.length; t++) {
                tile = tiles[t];
                tileset = this.data.GetTilesetForId(tile.data.id);
                if (tileset.GetPropertyValueFromId(tile.data.id, _property) == _value)
                    returnTiles.push(tile);
            }
            return returnTiles;
        }

        public GetNearestTileOnLayerByProperty(_point: Phaser.Point,_layer: string, _property: string, _value: string): TiledChunks.Tile {
            var tiles = this.GetTilesOnLayerByProperty(_layer, _property, _value);
            if (tiles.length > 0) {
                var nearest = tiles[0];
                var nearestDistance: number = _point.distance(tiles[0].point);
                var calculatedDistance: number;
                var tile: TiledChunks.Tile;
                for (var t = 1; t < tiles.length; t++) {
                    tile = tiles[t];
                    calculatedDistance = _point.distance(tile.point);
                    if (calculatedDistance < nearestDistance) {
                        nearest = tile
                        nearestDistance = calculatedDistance;
                    }
                }
                return nearest;
            }
            return null;
        }

        constructor(_game: Phaser.Game, _data: TiledChunks.MapData)
        {
            this.game = _game;
            this.data = _data;
            this.container = new Phaser.Group(_game);
            //this.container.x = this.data.tileWidth / 2;
            //this.container.y = this.data.tileHeight / 2;
            this.colliders = [];
            this.collisionChecks = 0;
            this.triggerChecks = 0;
            this.chunksDrawn = 0;
            

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
            
            console.log("Created chunks: " + Chunk.chunks);
            console.log("Created tiles: " + Tile.tiles);
        }
    }
}