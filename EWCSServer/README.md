
## Get Data List
```
start=`node -e "console.log(Date.now()-60*60*1000)"`
end=`node -e "console.log(Date.now())"`

curl "http://192.168.0.109:8080/api/data/history?start=$start&end=$end"
```

## Get Image List
```
start=`node -e "console.log(Date.now()-60*60*1000)"`
end=`node -e "console.log(Date.now())"`

curl "http://192.168.0.109:8080/api/image/history?start=$start&end=$end"
```

## Get Realtime Data History

```
start=`node -e "console.log(Date.now()-60*60*1000)"`
end=`node -e "console.log(Date.now())"`

echo "ewcs.cs125.current, ewcs.cs125.visibility"
curl "http://192.168.0.109:8080/history/ewcs.cs125.current,ewcs.cs125.visibility?start=$start&end=$end"
```
