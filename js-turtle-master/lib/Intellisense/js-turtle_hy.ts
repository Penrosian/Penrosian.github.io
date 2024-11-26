/**
 *   Կրիան շարժվում է առաջ, տրված քայլերի քանակով
 *   https://hanumanum.github.io/js-turtle/   
 *
 *   @param steps կրիայի քայլերի քանակը
 *   @return void
 */
declare function forward(steps: number): void;



/**
 *   Կրիան պտտվում է ձախ
 *   https://hanumanum.github.io/js-turtle/
 *
 *   @param angle անկյունը, որով պիտի պտտվի կրիան
 *   @return void
 */
declare function left(angle: number): void;



/**
 *   Կրիան պտտվում է աջ
 *   https://hanumanum.github.io/js-turtle/
 *
 *   @param angle անկյունը, որով պիտի պտտվի կրիան
 *   @return void
 */
declare function right(angle: number): void;


/**
 *   որոշվում է գծերի հաստությունը
 *   https://hanumanum.github.io/js-turtle/
 *
 *   @param thickness գծի հաստությունը
 *   @return void
 */
declare function width(thickness: number): void;


/**
 *   որոշվում է գծերի գույնը
 *   https://hanumanum.github.io/js-turtle/
 *
 *   @param r գույնի կոդի առաջին՝ կարմիր կոմպոնենտը,
 *            կամ գույնի անունը, 
 *            կամ 16-ական կոդը, 
 *            կամ գույնի RGB արժեքներով լցված զանգված
 *   @param g գույնի կոդի երկրորդ կոմպոնենտը՝ կանաչ
 *   @param b գույնի կոդի երրորդ կոմպոնենտը՝ կապույտ
 *   @param alpha գույնի թափանցիկությունը՝ 0֊ից 1 միջակայքում
 *   @return void
 */
declare function color(r: string|number[],g?:number, b?:number, alpha?:number): void;



/**
 *   փոխում է կրիայի դիրքը ըստ կորդինատների, գիծ չի գծում
 *   https://hanumanum.github.io/js-turtle/
 *
 *   @param x x կորդինատը 
 *   @param y կորդինատը
 *   @return void
 */
declare function goto(x:number, y:number): void;


/**
 *   բարձրացնում է գրիչը, դրանից հետո արված forward()-ները կտեղափոխեն կրիան, սակայն գծեր չեն գրծի
 *   https://hanumanum.github.io/js-turtle/
 *
 *   @return void
 */
declare function penup(): void;


/**
 *   իջեցնում է գրիչը
 *   https://hanumanum.github.io/js-turtle/
 *
 *   @return void
 */
declare function pendown(): void;



/**
 *   մաքրում է կտավը
 *   https://hanumanum.github.io/js-turtle/
 *
 *   @return void
 */
declare function clear(): void;



/**
 *   կտավի վրա գծում է կորդինատական համակարգ, նշաված քայլով
 *   https://hanumanum.github.io/js-turtle/
 *
 *   @param step կորդինատային համակարգի «քայլը»
 *   @return void
 */
declare function showGrid(step:number): void;


/**
 *   ընտրում է պատահական գույն
 *   https://hanumanum.github.io/js-turtle/
 *
 *   @return void
 */
declare function randomColor_h(): void;