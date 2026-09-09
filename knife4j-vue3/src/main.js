import { createApp } from 'vue'
import { Layout, Select, Input, Menu, Space, Tag, Button, Alert, Spin, Collapse, Empty, Modal, Tooltip, Table, Tabs, Form, Checkbox } from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import BasicLayout from './layouts/BasicLayout.vue'
import './style/goark.css'

const app = createApp(BasicLayout)
for (const component of [Layout, Select, Input, Menu, Space, Tag, Button, Alert, Spin, Collapse, Empty, Modal, Tooltip, Table, Tabs, Form, Checkbox]) app.use(component)
app.mount('#app')
