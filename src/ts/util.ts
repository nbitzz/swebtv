export function getPVs(time:number) {

    return {
        hours: Math.floor(time / 3600),
        minutes: Math.floor(time % 3600 / 60),
        seconds: Math.floor(time % 60)
    }

}

export function colonTime(time:number) { // ex. 5:30:02
    let PVs = getPVs(time);
    return ([
            // only include hours if specified
            ...(PVs.hours ? [PVs.hours] : []), PVs.minutes, PVs.seconds
        ])
            .map((v,x) => 
                v < 10 && x > 0 
                ? `0${v}` 
                : v.toString()
            ) // add zeros
            .join(":"); // join
}