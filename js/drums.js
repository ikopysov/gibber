const Ugen = require( './ugen.js' )

module.exports = function( Audio ) {

  const Drums = function( score, time, props ) { 
    // XXX what url prefix should I be using?
    const k  = Audio.instruments.Sampler({ filename:'http://127.0.0.1:10000/resources/kick.wav' })
    const s  = Audio.instruments.Sampler({ filename:'http://127.0.0.1:10000/resources/snare.wav' })
    const ch = Audio.instruments.Sampler({ filename:'http://127.0.0.1:10000/resources/hat.wav' })
    const oh = Audio.instruments.Sampler({ filename:'http://127.0.0.1:10000/resources/openHat.wav' })

    const drums = Audio.Ensemble({
      'x': { target:k,  method:'trigger', args:[1], name:'kick' },
      'o': { target:s,  method:'trigger', args:[1], name:'snare' },
      '*': { target:ch, method:'trigger', args:[1], name:'closedHat' },
      '-': { target:oh, method:'trigger', args:[1], name:'openHat' },
    })

    drums.seq = Audio.Seq({
      target:drums,
      key:'play',
      values:score.split(''),
      timings:time === undefined ? 1 / score.length : time
    }).start()

    drums.samplers = [ k,s,ch,oh ]

    const obj = drums
    let __value = 1
    drums.__pitch = { 
      value: __value,
      sProperty:true,
      sequencers:[],
      mods:[],
      name:'pitch',

      seq( values, timings, number = 0, delay = 0 ) {
        let prevSeq = obj.__pitch.sequencers[ number ] 
        if( prevSeq !== undefined ) { prevSeq.stop(); prevSeq.clear(); }

        // XXX you have to add a method that does all this shit on the worklet. crap.
        obj.__pitch.sequencers[ number ] = obj.__pitch[ number ] = Audio.Seq({ 
          values, 
          timings, 
          target:drums.__wrapped__, 
          key:'pitch'
        })
        .start( Audio.Clock.time( delay ) )

        // return object for method chaining
        return obj
      },
    }

    Audio.Gibberish.worklet.port.postMessage({
      address:'addMethod',
      key:'pitch',
      function:`function( pitch ) {
        for( let input of this.inputs ) {
          if( typeof input === 'object' ) input.rate = pitch
        }
      }`,
      id:drums.id,
      delay:Audio.shouldDelay
    })

    Object.defineProperty( drums, 'pitch', {
      configurable:true,
      get() { return this.__pitch },
      set(v){ 
        drums.__pitch.value = v
      }
    })

    //Ugen.createProperty( drums, 'pitch', drums.__wrapped__, [], Audio )

    return drums
  }

  const EDrums = function( score, time, props ) { 
    const k = Audio.instruments.Kick()
    const s = Audio.instruments.Snare()
    const ch = Audio.instruments.Hat({ decay:.1, gain:.2 })
    const oh = Audio.instruments.Hat({ decay:.5, gain:.2 })

    const drums = Audio.Ensemble({
      'x': { target:k, method:'trigger', args:[1], name:'kick' },
      'o': { target:s, method:'trigger', args:[1], name:'snare' },
      '*': { target:ch, method:'trigger', args:[.2], name:'closedHat' },
      '-': { target:oh, method:'trigger', args:[.2], name:'openHat' },
    })

    drums.seq = Audio.Seq({
      target:drums,
      key:'play',
      values:score.split(''),
      timings:time === undefined ? 1 / score.length : time
    }).start()

    return drums
  }

  return { Drums, EDrums }
}
