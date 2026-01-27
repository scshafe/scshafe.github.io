---
---

Once blob-royale is "more or less" working, run timing tests to figure out:

- how much stress the server can handle
- latency of back and forth
- misteps in network traffic
- time it takes server to compute each game tick
    - with various game parameters
        - weight
        - angles


## Does storing information as json objects (instead of converting int,float, etc to json before sending each time) save time

!!!
Compare timing without threading to timing with threading (and possibly caching values?)
