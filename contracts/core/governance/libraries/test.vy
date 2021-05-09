while(true)
        x += WEEK ### x = x +1
        d_slope: int128 = 0
        if x > timestamp:
            x = timestamp
        else:
            d_slope = self.slope_changes[x]
        last_point.bias -= last_point.slope * convert(x - last_point.timestamp, int128)
        
        if x == timestamp:
            break
        last_point.slope += d_slope
        last_point.ts = x

    if last_point.bias < 0:
        last_point.bias = 0
    return convert(last_point.bias, uint256)