biotrack is an app to track the bioantibiotics program for particular patients.
one of the pages is to list patients.
The list of patients allows to see current patients information which includes:

1. Unique identifier (rut)
2. Complete name
3. State of the patient (waiting for treatment, active, archived)

There should a filter to search for particular patients by name or by unique identifier. Olso there should be a button to add new clients and on each card/list item should be a button to edit the patients information.

# Patient details

there should be a patients detail page where particualr information of the patient is displayed.

## Antibiotics program

The idea is that the doctor can:

1. Select a particular antibiotic to be applied to the patient.
2. Select a particular ammount of antibiotic to apply
3. The start date, with default value current date.
4. Number of days of the antibiotics.
5. The option to change the antibiotics during the time execution.
6. During the antibiotics program is applied the patients is shown as active.
7. Once the patients end their antibiotics program, its status goes to pending.
8. There should be a binnacle of the applied antibiotics. It is a list where for each register there is the following information:
   - The antibiotic applied
   - The date when it was applied

Also there should be resume cards indicating: 1. Number of active day of the patients with antibiotics. Number of days remaining of current antibiotic program.

Also the doctor could during the execution of the program:

- suspend current treatment
- Change the program to a new one.
- extend the number of days of current program

## stats menu

# menu page

selecionar: uci / uti
visibilizar en que cama se encuentra. La UCI 1-17, UTI 18-34. Los pacientes pueden cambiar de cama. No pueden haber dos pacientes en la misma cama. Deberia haber una bitacora de por que camas ha pasado el paciente.

- dosis no es necesaria. Si es necesario poder poner Mas de un antibiotico en un programa y definir la periodicidad de cada antibiotico

- resumen nombre antibiotico. Rango de rechas aplicado, cantidad de dias en que se ha aplicado.

- alertas. En el mismo dia en el que se acaba el plan que aparecza una alerta.

# modifications 1:

- Add a Badge filter UCI/UTI so select between patients that are on diferent units. Also on each register of the list, show the unit where they belong.
- Add the unit selection in the new patient form.
- Also there are 17 beeds in UCI, named from 1- 17, and 17 beeds in UTI named from 18 to 34. Each patient should also be in a particular bed. The filter should enable the search but using the bed number with a dropdown.
- There should be a button to remove all filters.
- In the detail of the patient there should also be a bitacora of beeds the patient have used.
- In the antibiotic program specification, make the dosis of antibiotic optional, and add the option to select more than 1 antibiotic.
- for the bitacora of applied antibiotics, genererate one register for antibiotic with the following information: name of the antibiotics. Start date, last applied date, total number of dais applied. Also if the program is about to end, then the register should render in alert color and indicate in a batch that there is only 1 day left for the end of the program.
- If une or more antibiotics program is about to end, then in the patientsPage view, those one with that conditions should also show a badge indicating one day left.

# modificaciones 2:

- El reporte o resumen de bitacora de antibioticos que sea por antibiotico y no por programa. Es decir cada registro muestra antibioticos por separado.
- cada linea de los programas es por antibiotico por separado. Lo mismo para la bitacora de tratamiento.
- Agregar un total del total, como resumen pero al final que resuma la cantidad de dias de cada antibiotico aplicado, independiente si ocurre en un tramo seguido o en varios por separado.
- Fusionar dos tablas iniciales.
- cambiar total a total programado.
- sacar cambiar programa y reemplazar por finalizar.

- poner la cama al principio de la lista.
- filtrar por pacientes con alerta.
- Agregar un buscador en el formulario de nuevo programa
- Agregar una nueva lista / filtro en el formulario con Corticoides

- Algunos antibioticos parten del dia 0 y otros del dia 1, dependiendo del antibiotico. Dejar un valor por determinado con la opción de modificarlo. la mayoria es 0.

# modifications 2:

- In the detail view, join the antibiotic program and treatment binnacle into one list. Each register should have the same information of the antibiotic program. Start date, days applied / programed days. Status: active, suspended, extended, finished. The alert for 1 day left if apply. Actions buttons for suspend, extend, finalizar.
- Each register should have one antibiotic. So, even that when adding a new program with more than one antibiotic, there should be created one register per antibiotic selected.
- On the new program form, add a filter to make more easy to search particular antibiotics. Also add a gadge filter to filter by all/antibiotics/corticoides. Also add the option to select the start count that could be 0 or 1, with a default value depending on the selected antibiotic.
- Add a Total resume section at the end of the detail page that show in the The number of days the antibiotic with more days was applied and in the right a table with a bar indicating the amount of days each antibiotic was applied.
- In the patients view, place the bed column at the begining.
- Ad the option to filter patients with alerts (1 day left).

# features 3:

- Agregar estado de archivado.
- Agregar opción de archivado (dentro del hospital y se libera la cama de la unidad donde fuer archivado) o bien alta (tambien se libera).
- Al incorporar un paciente que ya fue dado de alta, la idea es que el aplicativo lo reconozca y reactive su estado.

- deberia haber un boton de editar, en la lista de tratamientos en caso de que me equivoque de opcion.
- la cantidad de dias aplicados sigue contando aunque se pasen los dias programados y cuando se pasen, entonces se pone en rojo la tarjeta.
- Al suspender solamente quedan los dias aplicados, y desaparecen los dias programados. Los dias left tambien desaparecen.

- Actualizar lista de antibioticos.
- Actualizar lista de unidades. UCI, UTI, UTIM, MEDICINA, CIRUGIA, URGENCIAS, GENICOLOGIA, PENCIONADOS, HD (HOSPITALIZACION DOMICILIARIA)

# observaciones

Pagina de Inicio:

- Agregar otras unidades
- agregar total de dias de antibioticos en la vista pacientes.

- En el detalle una linea cronolica de dias con antibioticos total continuo, total acumulado. Dias continuos de antibioticos.
- acumulado : suma, episodio : numero de dias continuos de tratamiento.
- tabla de resumen, poder ordenar por temporalidad. El de mas arriba es lo que deberia ser mas reciente.
- detalle, tabla principal. falta end date. que solo aparece cuando se finaliza o suspende.

# diagnostico:

diagnostico al momento de asignar un programa. Puede ser mas de un diagnostico.

- alertas por guia asociada a un diagnostico.
- Cada guia esta asociada a dias de episodios que de superarse deberian generar alertas.

- fecha inicio, fecha termino, total de dias. antibiotico utilizado. Si se puede agregar una lista de
