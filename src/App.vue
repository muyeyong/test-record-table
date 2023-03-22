<script setup lang="ts">
    import { reactive, ref, onMounted, nextTick } from 'vue'
    import { parse, parseFragment  } from 'parse5'
    const visible = ref(false)
    const checked1 = ref(false)
    const checked2 = ref(false)
    const tableRef = ref()
    const inputValue = ref()
    const modalDomObj = reactive<{ first: any, second: any}>({ first: null, second: null})
    const dataSource = reactive( [
          {
            key: '1',
            name: '胡彦斌',
            age: 32,
            address: '西湖区湖底公园1号',
          },
          {
            key: '2',
            name: '胡彦祖',
            age: 42,
            address: '西湖区湖底公园1号',
          }])
    const columns = reactive( [
          {
            title: '姓名',
            dataIndex: 'name',
            key: 'name',
          },
          {
            title: '年龄',
            dataIndex: 'age',
            key: 'age',
          },
          {
            title: '住址',
            dataIndex: 'address',
            key: 'address',
          },
        ])
    const observer = (target: any, callBack?: any) =>  {
        const ob = new MutationObserver(mutations => {
            // console.log(mutations);
            mutations.forEach(mutation => {
              if(callBack) callBack(mutation)
              // console.log(mutation)
                // const { type, target, oldValue, attributeName} = mutation;
                // switch (type) {
                //     case 'attributes':
                //         const value = target.getAttribute(attributeName);
                //         console.log("attributes", value);
                //         this.setAttributeAction(target);
                // }
            });
        }) 
        ob.observe(target, {
          // attributes: true,           //监控目标属性的改变
          // attributeOldValue: true,    //记录改变前的目标属性值
          subtree: true,              //目标以及目标的后代改变都会监控
          characterData: true,        //监控目标数据的改变
          characterDataOldValue: true,
          childList: true,
          // attributeFilter: []
      });
    }
    const observeElement = (element: any, property: any, callback: any, delay = 0) =>  {
      let elementPrototype = Object.getPrototypeOf(element);
      if (elementPrototype.hasOwnProperty(property)) {
          let descriptor = Object.getOwnPropertyDescriptor(elementPrototype, property);
          Object.defineProperty(element, property, {
              get: function() {
                  return descriptor?.get?.apply(this, arguments);
              },
              set: function () {
                  let oldValue = this[property];
                 descriptor?.set?.apply(this, arguments);
                  let newValue = this[property];
                  if (typeof callback == "function") {
                      setTimeout(callback.bind(this, oldValue, newValue), delay);
                  }
                  return newValue;
              }
          });
      }
}
    const add = () => {
      dataSource.push({
            key: (dataSource.length + 1).toString(),
            name: '王大大' + dataSource.length,
            age: 42,
            address: '也不知道在哪里',
          })
    }
    const deleteColumn = () => {
      dataSource.pop()
    }
    const modify = () => {
      dataSource[0].age = dataSource[0].age + 1
    }
    const handleOk = () => {
      // 序列化，进行比较
      const modalDom = document.querySelector("*[data-modal-record='true']")
      modalDomObj.second = parseFragment(modalDom?.innerHTML || "")
      visible.value = false
    }
    const openModal = () => {
      visible.value = true
      nextTick(() => {
        const modalDom = document.querySelector("*[data-modal-record='true']")
        // 序列化
        modalDomObj.first = parseFragment(modalDom?.innerHTML || "")
        const inputList = Array.from(modalDom?.querySelectorAll('input') || []) 
        inputList.forEach(input => {
          input.addEventListener("input", function () {
              console.log("Input value changed via UI. New value: '%s'", this.value);
          });
          observeElement(input, "value", function (oldValue: any, newValue: any) {
            //收集变化的属性
            console.log("Input value changed via API. Value changed from '%s' to '%s'", oldValue, newValue);
          });
        })
        observer(modalDom, (mutation: any) => {
           //收集变化的属性
           // 只监听一次，怎么处理
           console.log(mutation)
          //  if(mutation.type === 'characterData') {
          //    console.log(mutation)
          //  }
        })
      })
    }
    onMounted(() => {
      const recordTable = document.querySelector("*[data-record='true']")
      observer(recordTable, (mutation: any) => {
        console.log('table', mutation)
      })
    //  console.log(parseFragment (recordTable?.innerHTML || ''))
    })
</script>

<template>
 
    <a-table :dataSource="dataSource" :columns="columns" ref="tableRef" data-record="true" />
    <div style="display: flex;">
      <a-button @click="add">新增一行</a-button>
      <a-button @click="deleteColumn">删除一行</a-button>
      <a-button @click="modify">修改一行</a-button>
    </div>
    <a-modal v-model:visible="visible" title="Basic Modal" @ok="handleOk"  >
      <div data-modal-record="true">
        <div style="display: flex;">
          <span>姓名</span>
          <input v-model="inputValue"/>
          <!-- <a-input style="width: 60%;"></a-input> -->
        </div>
        <div style="display: flex;">
          <span>年龄</span>
          <a-select>
            <a-select-option value="18">18</a-select-option>
            <a-select-option value="28">28</a-select-option>
            <a-select-option value="38">38</a-select-option>
          </a-select>
        </div>
        <div style="display: flex;">
          <span>地址</span>
          <div>
            <a-checkable-tag v-model:checked="checked1">东大街</a-checkable-tag>
            <a-checkable-tag v-model:checked="checked2">北大街</a-checkable-tag>
          </div>
        </div>
      </div>
      
    </a-modal>
    <a-button @click="openModal">对话框录入数据</a-button>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
