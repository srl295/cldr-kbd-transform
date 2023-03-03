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
    <input v-model="source" />
    <h2>
      Target
    </h2>
    <input v-model="target" />
    <hr>
    <p>
      {{ status }}
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

const sampleXml = `
<!-- sample XML -->
<keyboard>
    <variables>
      <variable id="left_matras" value="[X]"/>
      <variable id="consonants" value="[ABCD]"/>
      <variable id="zwnj" value="\\u{200C}" />
      <variable id="quot" value="\\u{0022}" />
    </variables>
<transforms type="simple">
    <transformGroup>
      <transform from="a" to="b"/>
      <transform from="c" to="d"/>
    </transformGroup>
    <transformGroup>
      <transform from="q" to="\\u{0022}"/> <!-- quote -->
      <transform from="Q" to="\\\${quot}" />
    </transformGroup>
    <transformGroup>
      <transform from="\\\${zwnj}(\\\${left_matras})(\\\${consonants})" to="$2$1"/>
    </transformGroup>
</transforms>
</keyboard>
`.trim();

export default {
  data() {
    return {
      xml: sampleXml,
      source: 'Quack: a big happy string',
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
