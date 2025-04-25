import "./css/app.css"

import { Application } from "@hotwired/stimulus"
import ModeSwitchController from "./js/controllers/mode_switch_controller"

const application = Application.start()
application.register("mode-switch", ModeSwitchController)
