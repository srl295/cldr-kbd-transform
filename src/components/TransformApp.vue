<script setup lang="ts">
// defineProps<{
//   msg: string
// }>()
</script>

<template>
  <div class="greetings">
    <h1 class="green"></h1>
    <h2>
      XML Source
    </h2>
    <textarea cols="60" rows="20" v-model="xml" placeholder="<keyboard>…</keyboard>"></textarea>
    <h2>
      Text Source
    </h2>
    <input v-model="source" size="50"  />
    <h2>
      Target
    </h2>
    <input v-model="target" size="50" />
    <hr>
    <p>
      <span style="color: red" v-if="status !== 'done'">⚠</span>{{ status }}
    </p>

  </div>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

@media (min-width: 1024px) {

  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
}
</style>

<script lang="ts">

import { processTransform } from '@/lib/transform';
import { getSampleXml, getSampleSource } from '@/lib/transform-sample';


const sampleXml = getSampleXml().trim();

export default {
  data() {
    return {
      xml: sampleXml,
      source: getSampleSource(),
      target: '',
      status: 'Ready',
    };
  },
  watch: {
    source(newSource) {
      this.transform();
    },
    xml(newXml) {
      this.transform();
    },
  },
  beforeMount() {
   this.transform(); // load it once
  },
  methods: {
    transform() {
      this.status = 'Working…';
      try {
        this.target = processTransform(this.xml, this.source);
        this.status = 'done';
      } catch (e) {
        this.status = `ERR! ${e}`;
      }
    },
  },
};

</script>
