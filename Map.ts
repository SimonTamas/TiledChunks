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
        lazyColliders: Phaser.Sprite[];
        obstacles: Phaser.Group;
        quadtree: Phaser.QuadTree;
        progress: number;
        progressCallback: Function;
        progressCallbackContext: Object;
        progressTotal: number;

        // DEBUG
        triggerChecks: number;
        collisionChecks: number;
        chunksDrawn: number;

        // ----------------------------------------------------------------------------------------------
        // ----------------------------------- MAP EVENT HANDLING ---------------------------------------
        // ----------------------------------------------------------------------------------------------

        public AddListener(_sprite: Phaser.Sprite, _event: string, _callback: Function, _callbackContext?: Object): void
        {
            this.listeners.push(new TiledChunks.MapListener(_sprite, _event, _callback, _callbackContext));
        }

        
        public RemoveListener(_sprite: Phaser.Sprite, _event:string): void
        {
            var i: number = 0;
            while (i < this.listeners.length && this.listeners[i].event != _event || this.listeners[i].sprite !== _sprite)
                i++;
            if (i < this.listeners.length)
                this.listeners.splice(i, 1);
        }

        public OnTriggerEnter(_trigger: TiledChunks.Trigger, _collider: Phaser.Sprite): void {
            for (var l: number = 0; l < this.listeners.length; l++)
                if (this.listeners[l].event == "OnTriggerEnter" && this.listeners[l].sprite == _collider)
                    this.listeners[l].callback(_trigger, this.listeners[l].callbackContext);
        }

        public OnTriggerLeave(_trigger: TiledChunks.Trigger, _collider: Phaser.Sprite): void {
            for (var l: number = 0; l < this.listeners.length; l++)
                if (this.listeners[l].event == "OnTriggerLeave" && this.listeners[l].sprite == _collider)
                    this.listeners[l].callback(_trigger, this.listeners[l].callbackContext);
        }

        public OnCollision(_collider: Phaser.Sprite, _other: Phaser.Sprite): void {
            for (var l: number = 0; l < this.listeners.length; l++) {
                if (this.listeners[l].event == "OnCollision") {
                    if (this.listeners[l].sprite.name == _collider.name)
                        this.listeners[l].callback(_other, this.listeners[l].callbackContext);
                    if (this.listeners[l].sprite.name == _other.name)
                        this.listeners[l].callback(_collider, this.listeners[l].callbackContext);
                }
            }
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

        public AddToLayer(_sprite: any, _layer: string, _isCollider: boolean, _isLazyCollider?: boolean): void {
            var layer: MapLayer = this.GetLayer(_layer);
            layer.container.add(_sprite);
            if (_isCollider)
                this.AddCollider(_sprite, _isLazyCollider);
        }

        public UpdateChunksAround(_cR: number, _cC: number): void {

            for (var r: number = 0; r < this.chunks.length; r++)
                for (var c: number = 0; c < this.chunks[r].length; c++)
                    this.chunks[r][c].PrematureDeactivation();
            
            this.centerChunk = this.chunks[_cR][_cC];

            if (this.centerChunk) {
                this.centerChunk.Activate();
                this.centerChunk.ActivateAdjacent();
            }

            for (var r: number = 0; r < this.chunks.length; r++) 
                for (var c: number = 0; c < this.chunks[r].length; c++)
                    this.chunks[r][c].DeactivationCheck();
        }

        public IsCollidingWithSimmilarTrigger(_collider: Phaser.Sprite, _trigger: TiledChunks.Trigger, _chunk: TiledChunks.Chunk, _propagating?: boolean): boolean
        {
            var c: number = 0;
            while (c < _chunk.triggers.length && ( _chunk.triggers[c].id != _trigger.id ||  !_chunk.triggers[c].HasCollider(_collider)))
                c++;
            if (c < _chunk.triggers.length)
                return true;
            else if (!_propagating) {
                var a: number = 0;
                while (a < _chunk.adjacentCollisionChunks.length && !this.IsCollidingWithSimmilarTrigger(_collider, _trigger, _chunk.adjacentCollisionChunks[a],true))
                    a++;
                return a < _chunk.adjacentCollisionChunks.length;
            }
        }

        public AddCollider(_collider: Phaser.Sprite, _isLazyCollider?: boolean): void {
            // Lazy colliders only check collision
            // with adjacent collision chunks 
            if (_isLazyCollider)
                this.lazyColliders.push(_collider);
            else
                this.colliders.push(_collider);
            this.quadtree.insert(_collider);
        }

        public RemoveCollider(_collider: Phaser.Sprite): void {
            var c: number = 0;
            while (c < this.colliders.length && this.colliders[c] !== _collider)
                c++;
            if (c < this.colliders.length) {
                this.colliders.splice(c, 1);
            }
        }

        public UpdateCollisionOnChunk(_collider: Phaser.Sprite, _colliderIndex:number, _chunk: TiledChunks.Chunk): void
        {
            // With other colliders
            // and sort them in the meantime
            for (var l: number = 0; l < this.colliders.length; l++) {
                if (_colliderIndex != l) {
                    if (this.game.physics.arcade.collide(_collider, this.colliders[l]))
                        this.OnCollision(_collider, this.colliders[l]);
                    this.collisionChecks++;
                }
            }

            // Check collision between collider and tiles.
            var tile: Phaser.Sprite;
            for (var c: number = 0; c < _chunk.colliders.length; c++) {
                tile = _chunk.colliders[c];
                if (this.game.physics.arcade.collide(_collider, tile))
                    this.OnCollision(_collider, tile);
                this.collisionChecks++;
            }

            var trigger: Trigger;
            for (var t: number = 0; t < _chunk.triggers.length; t++) {
                this.triggerChecks++;
                trigger = _chunk.triggers[t];
                if (this.game.physics.arcade.overlap(_collider, trigger)) {
                    if (!trigger.HasCollider(_collider)) {
                        // A collider will only enter a trigger
                        // if it is not colliding with any other simmilar triggers
                        if (!this.IsCollidingWithSimmilarTrigger(_collider, trigger, _chunk))
                            this.OnTriggerEnter(trigger, _collider);
                        trigger.AddCollider(_collider);
                    }
                }
                else if (trigger.HasCollider(_collider)) {
                    trigger.RemoveCollider(_collider);
                    // A collider will only leave a trigger
                    // if it no longer collides with any other simmilar triggers
                    if (!this.IsCollidingWithSimmilarTrigger(_collider, trigger, _chunk))
                        this.OnTriggerLeave(trigger, _collider);
                }
            }
        }
           

        public UpdateCollisions(): void 
        {
            this.colliders.sort(function (_a: Phaser.Sprite, _b: Phaser.Sprite) {
                if (_a.world.y > _b.world.y) {
                    _a.bringToTop();
                    return 1;
                }
                else
                    return 0;
            });
            
            var collider: Phaser.Sprite;

            for (var i: number = 0; i < this.colliders.length; i++) {
                collider = this.colliders[i];
                var obstacles: any[];
                var obstacle: any;
                obstacles = this.quadtree.retrieve(collider);
                for (var o: number = 0; o < obstacles.length; o++) {
                    obstacle = obstacles[o];
                    if (this.game.physics.arcade.collide(collider, obstacle))
                        this.OnCollision(collider, obstacle);
                    this.collisionChecks++;
                }
            }

            for (var l: number = 0; l < this.lazyColliders.length; l++) {
                collider = this.lazyColliders[l];
                this.UpdateCollisionOnChunk(collider,l,this.centerChunk);
                for (var a: number = 0; a < this.centerChunk.adjacentCollisionChunks.length; a++)
                    this.UpdateCollisionOnChunk(collider,l,this.centerChunk.adjacentCollisionChunks[a]);
            }
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


        public CacheNextAdjacentGraphicalChunk(_r: number, _c: number, _callback: Function): void {
            var map = this;
            map.progress += 1;
            this.chunks[_r][_c].CacheAdjacentGraphicalChunks(function () {
                if (_c + 1 >= map.chunks[_r].length) {
                    _r++;
                    _c = 0;
                }
                else
                    _c++;

                if (map.progressCallback && _c == 0) {
                    setTimeout(function () {
                        map.progressCallback((map.progress * 100) / map.progressTotal, map.progressCallbackContext);
                        if (_r < map.chunks.length)
                            map.CacheNextAdjacentGraphicalChunk(_r, _c, _callback);
                        else
                            _callback();
                    }, 1);
                }
                else if (_r < map.chunks.length)
                    map.CacheNextAdjacentGraphicalChunk(_r, _c, _callback);
                else
                    _callback();
            });
        }

        public CacheAdjacentGraphicalChunks(_callback?: Function, _callbackContext?: Object): void {
            this.CacheNextAdjacentGraphicalChunk(0, 0, function () {
                if (_callback)
                    _callback(_callbackContext);
            });
        }

        public CacheNextAdjacentCollisionChunk(_r: number, _c: number) {
            var map = this;
            map.progress += 1;
            this.chunks[_r][_c].CacheAdjacentCollisionChunks(function () {
                if (_c + 1 >= map.chunks[_r].length) {
                    _r++;
                    _c = 0;
                }
                else
                    _c++;
                if (map.progressCallback && _c == 0) {
                    setTimeout(function () {
                        map.progressCallback((map.progress * 100) / map.progressTotal, map.progressCallbackContext);
                        if (_r < map.chunks.length)
                            map.CacheNextAdjacentCollisionChunk(_r, _c);
                    }, 1);
                }
                else if(_r < map.chunks.length)
                    map.CacheNextAdjacentCollisionChunk(_r, _c);
            });
        }

        public CacheAdjacentCollisionChunks(): void {
            this.CacheNextAdjacentCollisionChunk(0, 0);
        }
        

        public LoadCachedGraphicalChunks(_adjacentChunksCache:number[][][][]): void {
            for (var r: number = 0; r < _adjacentChunksCache.length; r++) {
                for (var c: number = 0; c < _adjacentChunksCache[r].length; c++) {
                    this.chunks[r][c].adjacentGraphicalChunks = [];
                    for (var a: number = 0; a < _adjacentChunksCache[r][c].length; a++) {
                        this.chunks[r][c].adjacentGraphicalChunks.push(this.chunks[_adjacentChunksCache[r][c][a][0]][_adjacentChunksCache[r][c][a][1]]);
                    }
                }
            }
        }

        public GetCachedGraphicalChunks(): number[][][][] {
            console.log("getting cached graphical chunks");
            var returnChunks: number[][][][] = [];
            var chunk: TiledChunks.Chunk;
            var adjacentChunk: TiledChunks.Chunk;
            for (var r: number = 0; r < this.chunks.length; r++) {
                returnChunks[r] = [];
                for (var c: number = 0; c < this.chunks[r].length; c++) {
                    chunk = this.chunks[r][c];
                    returnChunks[r][c] = [];
                    for (var a: number = 0; a < chunk.adjacentGraphicalChunks.length; a++) {
                        adjacentChunk = chunk.adjacentGraphicalChunks[a];
                        returnChunks[r][c][a] = [adjacentChunk.coord.row, adjacentChunk.coord.column];
                    }
                }
            }
            console.log("returning cached graphical chunks");
            return returnChunks;
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

        private TileInTileArray(_tile: TiledChunks.Tile, _tiles: TiledChunks.Tile[]): boolean {
            var t: number = 0;
            while (t < _tiles.length && _tiles[t] != _tile)
                t++;
            return t < _tiles.length;
        }

        public GetExactTileOnLayer(_tile: TiledChunks.Tile, _layer: string): TiledChunks.Tile {
            var tiles: TiledChunks.Tile[] = this.GetTilesOnLayer(_layer);
            if (tiles.length > 0) {
                var t: number = 0;
                while (t < tiles.length && tiles[t].key != _tile.key)
                    t++;
                if (t < tiles.length)
                    return tiles[t];
            }
            return null;
        }

        public GetNearestTileOnLayer(_point: Phaser.Point, _layer: string): TiledChunks.Tile {
            var tiles: TiledChunks.Tile[] = this.GetTilesOnLayer(_layer);
            if (tiles.length > 0) {
                var nearest = null;
                var nearestDistance: number;
                var calculatedDistance: number;
                var tile: TiledChunks.Tile;
                for (var t = 0; t < tiles.length; t++) {
                    tile = tiles[t];
                    calculatedDistance = _point.distance(tile.point);
                    if (!nearestDistance || calculatedDistance < nearestDistance) {
                        nearest = tile
                        nearestDistance = calculatedDistance;
                    }
                }
                return nearest;
            }
            return null;
        }

        public GetNearestTileOnLayerByProperty(_point: Phaser.Point, _layer: string, _property: string, _value: string, _exceptions?: TiledChunks.Tile[]): TiledChunks.Tile {
            var tiles: TiledChunks.Tile[] = this.GetTilesOnLayerByProperty(_layer, _property, _value);
            if (tiles.length > 0) {
                var nearest = null;
                var nearestDistance: number;
                var calculatedDistance: number;
                var tile: TiledChunks.Tile;
                for (var t = 0; t < tiles.length; t++) {
                    tile = tiles[t];
                    if ( !_exceptions || !this.TileInTileArray(tile, _exceptions) )
                    {
                        calculatedDistance = _point.distance(tile.point);
                        if ( !nearestDistance || calculatedDistance < nearestDistance) {
                            nearest = tile
                            nearestDistance = calculatedDistance;
                        }
                    }
                }
                return nearest;
            }
            return null;
        }

        constructor(_game: Phaser.Game, _data: TiledChunks.MapData, _progressCallback?: Function, _progressCallbackContext?: Object)
        {
            // Store varables
            this.game = _game;
            this.data = _data;
            
            // Init variables
            this.container = new Phaser.Group(_game, null, "world-container", false);
            this.quadtree = new Phaser.QuadTree(0, 0, _data.worldWidth, _data.worldHeight, 10, 5);
            this.progress = 0;
            this.progressCallback = _progressCallback;
            this.progressCallbackContext = _progressCallbackContext;
            this.progressTotal = (_data.chunkRows * _data.chunkColumns) * 2;
        
            // Colliders
            this.colliders = [];
            this.lazyColliders = [];

            // For debug
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
            // chunkRows * chunkColumns ..... 100
            // r*chunkRows + c .............. x
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
            
            this.CacheAdjacentGraphicalChunks();
            this.CacheAdjacentCollisionChunks();

            // Updating the map causes it to be drawn...
            this.UpdateMap();

        }
    }
}